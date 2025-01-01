import { type DynamoDBStreamHandler } from "aws-lambda";
import { metricScope, Unit, StorageResolution } from "aws-embedded-metrics";
import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { CloudWatchClient, GetMetricWidgetImageCommand } from "@aws-sdk/client-cloudwatch";
import { parse as parseArn } from "@aws-sdk/util-arn-parser";

/**
 * @example
 *
 * {
 *   "Records": [
 *     {
 *       "eventID": "d245400f09fe95354fca023ac597d736",
 *       "eventName": "REMOVE",
 *       "eventVersion": "1.1",
 *       "eventSource": "aws:dynamodb",
 *       "awsRegion": "us-east-1",
 *       "dynamodb": {
 *         "ApproximateCreationDateTime": 1732815376,
 *         "Keys": {
 *           "sk": {
 *             "S": "2024-11-28T17:27:37.645631Z"
 *           },
 *           "pk": {
 *             "S": "2024-11-28T17:27:37.645631Z"
 *           }
 *         },
 *         "OldImage": {
 *           "sk": {
 *             "S": "2024-11-28T17:27:37.645631Z"
 *           },
 *           "pk": {
 *             "S": "2024-11-28T17:27:37.645631Z"
 *           },
 *           "ttl": {
 *             "N": "1732814857"
 *           }
 *         },
 *         "SequenceNumber": "3832500000000056612526359",
 *         "SizeBytes": 125,
 *         "StreamViewType": "NEW_AND_OLD_IMAGES"
 *       },
 *       "userIdentity": {
 *         "principalId": "dynamodb.amazonaws.com",
 *         "type": "Service"
 *       },
 *       "eventSourceARN": "arn:aws:dynamodb:us-east-1:750010179392:table/DdbTtlSlaStack-DDBTTL0622B9A2-X0AOESJQCXKS/stream/2024-11-27T21:35:33.881"
 *     }
 *   ]
 * }
 */

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});
const cloudwatchClient = new CloudWatchClient({
  region: process.env.AWS_REGION,
});

export const handler: DynamoDBStreamHandler = metricScope((metrics) => async (event, context) => {
  console.log("Processing DynamoDB Stream Event:", JSON.stringify(event, null, 2), JSON.stringify(context, null, 2));

  const parsedEvent = z
    .object({
      Records: z
        .array(
          z.object({
            eventName: z.enum(["REMOVE"]),
            dynamodb: z.object({
              Keys: z.object({
                pk: z.object({
                  S: z.string(),
                }),
              }),
            }),
          }),
        )
        .length(1),
    })
    .parse(event);

  const record = parsedEvent.Records[0]!!;

  const differenceFromNow = new Date().getTime() - new Date(record.dynamodb.Keys.pk.S).getTime();

  metrics.putMetric("ttl-latency", differenceFromNow, Unit.Milliseconds, StorageResolution.Standard);

  const environmentVariables = z
    .object({
      BUCKET: z.string(),
      AWS_REGION: z.string(),
      AWS_LAMBDA_FUNCTION_NAME: z.string(),
    })
    .parse(process.env);

  const accountId = parseArn(context.invokedFunctionArn).accountId;

  const getLatencyMetricWidgetImageOutput = await cloudwatchClient.send(
    new GetMetricWidgetImageCommand({
      MetricWidget: JSON.stringify({
        metrics: [
          [
            {
              expression: "(m1 / 1000) / 60",
              label: "Time elapsed between TTL and removal",
              id: "e1",
              region: environmentVariables.AWS_REGION,
              accountId,
            },
          ],
          [
            "aws-embedded-metrics",
            "ttl-latency",
            "LogGroup",
            context.functionName,
            "ServiceName",
            context.functionName,
            "ServiceType",
            "AWS::Lambda::Function",
            {
              id: "m1",
              visible: false,
              period: 300,
              region: environmentVariables.AWS_REGION,
              accountId,
            },
          ],
        ],
        sparkline: false,
        view: "timeSeries",
        stacked: false,
        region: environmentVariables.AWS_REGION,
        stat: "Maximum",
        period: 60,
        start: "-PT24H",
        yAxis: {
          left: {
            min: 0,
            showUnits: false,
            label: "Minutes",
          },
        },
        liveData: false,
        setPeriodToTimeRange: true,
        title: `DynamoDB TTL Latency (updated @ ${new Date().toISOString()})`,
        width: 768,
        height: 384,
        theme: "dark",
      }),
      OutputFormat: "png",
    }),
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: "ttl-latency.png",
      Body: getLatencyMetricWidgetImageOutput.MetricWidgetImage,
      ContentEncoding: "base64",
      ContentType: "image/png",
    }),
  );
});
