import { Stack, type StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, StreamViewType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { StartingPosition } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { join } from "path";

export class DdbTtlStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new Table(this, "Table", {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING,
      },
      timeToLiveAttribute: "ttl",
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const putItemRule = new Rule(this, "EventBridgeRule", {
      schedule: Schedule.cron({ minute: "*" }),
    });

    const itemPutter = new NodejsFunction(this, "ItemPutterFunction", {
      entry: join(__dirname, "put-item.function.ts"),
      handler: "handler",
      environment: {
        TABLE: table.tableName,
      },
    });

    table.grantWriteData(itemPutter);

    putItemRule.addTarget(new LambdaFunction(itemPutter));

    const bucket = new Bucket(this, "Bucket", {
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicPolicy: false,
        blockPublicAcls: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      enforceSSL: true,
    });

    const streamProcessor = new NodejsFunction(this, "StreamProcessorFunction", {
      entry: join(__dirname, "process-stream.function.ts"),
      handler: "handler",
      environment: {
        BUCKET: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(streamProcessor);

    table.grantStreamRead(streamProcessor);

    streamProcessor.role!!.addToPrincipalPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["cloudwatch:GetMetricWidgetImage"],
        resources: ["*"],
      }),
    );

    streamProcessor.addEventSourceMapping("DDBStreamEventSource", {
      eventSourceArn: table.tableStreamArn!,
      startingPosition: StartingPosition.LATEST,
      batchSize: 1,
      retryAttempts: 0,
    });
  }
}
