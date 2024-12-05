import { App } from "aws-cdk-lib";
import { DdbTtlStack } from "../lib/ddb-ttl-stack";
import { Template } from "aws-cdk-lib/assertions";

type TemplateJson = ReturnType<Template["toJSON"]>;

const replaceS3Key: (template: TemplateJson) => TemplateJson = (template) => {
  if (Array.isArray(template)) {
    return template.map((item) => replaceS3Key(item));
  } else if (template !== null && typeof template === "object") {
    for (let key in template) {
      if (template.hasOwnProperty(key)) {
        if (key === "S3Key") {
          template[key] = "NON-DETERMINISTIC VALUE. Replaced for tests only.";
        } else {
          template[key] = replaceS3Key(template[key]);
        }
      }
    }
  }
  return template;
};

describe(DdbTtlStack, () => {
  test("Matches the snapshot", () => {
    const app = new App();

    const ddbTtlStack = new DdbTtlStack(app, "DdbTtlStack");

    const template = Template.fromStack(ddbTtlStack);

    expect(replaceS3Key(template.toJSON())).toMatchInlineSnapshot(`
      {
        "Parameters": {
          "BootstrapVersion": {
            "Default": "/cdk-bootstrap/hnb659fds/version",
            "Description": "Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip]",
            "Type": "AWS::SSM::Parameter::Value<String>",
          },
        },
        "Resources": {
          "Bucket83908E77": {
            "DeletionPolicy": "Retain",
            "Properties": {
              "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": false,
                "BlockPublicPolicy": false,
                "IgnorePublicAcls": false,
                "RestrictPublicBuckets": false,
              },
            },
            "Type": "AWS::S3::Bucket",
            "UpdateReplacePolicy": "Retain",
          },
          "BucketPolicyE9A3008A": {
            "Properties": {
              "Bucket": {
                "Ref": "Bucket83908E77",
              },
              "PolicyDocument": {
                "Statement": [
                  {
                    "Action": "s3:*",
                    "Condition": {
                      "Bool": {
                        "aws:SecureTransport": "false",
                      },
                    },
                    "Effect": "Deny",
                    "Principal": {
                      "AWS": "*",
                    },
                    "Resource": [
                      {
                        "Fn::GetAtt": [
                          "Bucket83908E77",
                          "Arn",
                        ],
                      },
                      {
                        "Fn::Join": [
                          "",
                          [
                            {
                              "Fn::GetAtt": [
                                "Bucket83908E77",
                                "Arn",
                              ],
                            },
                            "/*",
                          ],
                        ],
                      },
                    ],
                  },
                  {
                    "Action": "s3:GetObject",
                    "Effect": "Allow",
                    "Principal": {
                      "AWS": "*",
                    },
                    "Resource": {
                      "Fn::Join": [
                        "",
                        [
                          {
                            "Fn::GetAtt": [
                              "Bucket83908E77",
                              "Arn",
                            ],
                          },
                          "/*",
                        ],
                      ],
                    },
                  },
                ],
                "Version": "2012-10-17",
              },
            },
            "Type": "AWS::S3::BucketPolicy",
          },
          "EventBridgeRule15224D08": {
            "Properties": {
              "ScheduleExpression": "cron(* * * * ? *)",
              "State": "ENABLED",
              "Targets": [
                {
                  "Arn": {
                    "Fn::GetAtt": [
                      "ItemPutterFunction074B71F8",
                      "Arn",
                    ],
                  },
                  "Id": "Target0",
                },
              ],
            },
            "Type": "AWS::Events::Rule",
          },
          "EventBridgeRuleAllowEventRuleDdbTtlStackItemPutterFunction6BC3C371A2EE65A0": {
            "Properties": {
              "Action": "lambda:InvokeFunction",
              "FunctionName": {
                "Fn::GetAtt": [
                  "ItemPutterFunction074B71F8",
                  "Arn",
                ],
              },
              "Principal": "events.amazonaws.com",
              "SourceArn": {
                "Fn::GetAtt": [
                  "EventBridgeRule15224D08",
                  "Arn",
                ],
              },
            },
            "Type": "AWS::Lambda::Permission",
          },
          "ItemPutterFunction074B71F8": {
            "DependsOn": [
              "ItemPutterFunctionServiceRoleDefaultPolicy9AE5D701",
              "ItemPutterFunctionServiceRole27F5008B",
            ],
            "Properties": {
              "Code": {
                "S3Bucket": {
                  "Fn::Sub": "cdk-hnb659fds-assets-\${AWS::AccountId}-\${AWS::Region}",
                },
                "S3Key": "NON-DETERMINISTIC VALUE. Replaced for tests only.",
              },
              "Environment": {
                "Variables": {
                  "AWS_NODEJS_CONNECTION_REUSE_ENABLED": "1",
                  "TABLE": {
                    "Ref": "TableCD117FA1",
                  },
                },
              },
              "Handler": "index.handler",
              "Role": {
                "Fn::GetAtt": [
                  "ItemPutterFunctionServiceRole27F5008B",
                  "Arn",
                ],
              },
              "Runtime": "nodejs16.x",
            },
            "Type": "AWS::Lambda::Function",
          },
          "ItemPutterFunctionServiceRole27F5008B": {
            "Properties": {
              "AssumeRolePolicyDocument": {
                "Statement": [
                  {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                      "Service": "lambda.amazonaws.com",
                    },
                  },
                ],
                "Version": "2012-10-17",
              },
              "ManagedPolicyArns": [
                {
                  "Fn::Join": [
                    "",
                    [
                      "arn:",
                      {
                        "Ref": "AWS::Partition",
                      },
                      ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                    ],
                  ],
                },
              ],
            },
            "Type": "AWS::IAM::Role",
          },
          "ItemPutterFunctionServiceRoleDefaultPolicy9AE5D701": {
            "Properties": {
              "PolicyDocument": {
                "Statement": [
                  {
                    "Action": [
                      "dynamodb:BatchWriteItem",
                      "dynamodb:PutItem",
                      "dynamodb:UpdateItem",
                      "dynamodb:DeleteItem",
                      "dynamodb:DescribeTable",
                    ],
                    "Effect": "Allow",
                    "Resource": [
                      {
                        "Fn::GetAtt": [
                          "TableCD117FA1",
                          "Arn",
                        ],
                      },
                      {
                        "Ref": "AWS::NoValue",
                      },
                    ],
                  },
                ],
                "Version": "2012-10-17",
              },
              "PolicyName": "ItemPutterFunctionServiceRoleDefaultPolicy9AE5D701",
              "Roles": [
                {
                  "Ref": "ItemPutterFunctionServiceRole27F5008B",
                },
              ],
            },
            "Type": "AWS::IAM::Policy",
          },
          "StreamProcessorFunctionCB303F00": {
            "DependsOn": [
              "StreamProcessorFunctionServiceRoleDefaultPolicy558039BD",
              "StreamProcessorFunctionServiceRole29022749",
            ],
            "Properties": {
              "Code": {
                "S3Bucket": {
                  "Fn::Sub": "cdk-hnb659fds-assets-\${AWS::AccountId}-\${AWS::Region}",
                },
                "S3Key": "NON-DETERMINISTIC VALUE. Replaced for tests only.",
              },
              "Environment": {
                "Variables": {
                  "AWS_NODEJS_CONNECTION_REUSE_ENABLED": "1",
                  "BUCKET": {
                    "Ref": "Bucket83908E77",
                  },
                },
              },
              "Handler": "index.handler",
              "Role": {
                "Fn::GetAtt": [
                  "StreamProcessorFunctionServiceRole29022749",
                  "Arn",
                ],
              },
              "Runtime": "nodejs16.x",
            },
            "Type": "AWS::Lambda::Function",
          },
          "StreamProcessorFunctionDynamoDBEventSourceDdbTtlStackTable86CC4BFE6E25545F": {
            "Properties": {
              "BatchSize": 1,
              "EventSourceArn": {
                "Fn::GetAtt": [
                  "TableCD117FA1",
                  "StreamArn",
                ],
              },
              "FilterCriteria": {
                "Filters": [
                  {
                    "Pattern": "{"eventName":["REMOVE"]}",
                  },
                ],
              },
              "FunctionName": {
                "Ref": "StreamProcessorFunctionCB303F00",
              },
              "MaximumRetryAttempts": 1,
              "StartingPosition": "LATEST",
            },
            "Type": "AWS::Lambda::EventSourceMapping",
          },
          "StreamProcessorFunctionServiceRole29022749": {
            "Properties": {
              "AssumeRolePolicyDocument": {
                "Statement": [
                  {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                      "Service": "lambda.amazonaws.com",
                    },
                  },
                ],
                "Version": "2012-10-17",
              },
              "ManagedPolicyArns": [
                {
                  "Fn::Join": [
                    "",
                    [
                      "arn:",
                      {
                        "Ref": "AWS::Partition",
                      },
                      ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                    ],
                  ],
                },
              ],
            },
            "Type": "AWS::IAM::Role",
          },
          "StreamProcessorFunctionServiceRoleDefaultPolicy558039BD": {
            "Properties": {
              "PolicyDocument": {
                "Statement": [
                  {
                    "Action": "dynamodb:ListStreams",
                    "Effect": "Allow",
                    "Resource": "*",
                  },
                  {
                    "Action": [
                      "dynamodb:DescribeStream",
                      "dynamodb:GetRecords",
                      "dynamodb:GetShardIterator",
                    ],
                    "Effect": "Allow",
                    "Resource": {
                      "Fn::GetAtt": [
                        "TableCD117FA1",
                        "StreamArn",
                      ],
                    },
                  },
                  {
                    "Action": "cloudwatch:GetMetricWidgetImage",
                    "Effect": "Allow",
                    "Resource": "*",
                  },
                  {
                    "Action": [
                      "s3:GetObject*",
                      "s3:GetBucket*",
                      "s3:List*",
                      "s3:DeleteObject*",
                      "s3:PutObject",
                      "s3:PutObjectLegalHold",
                      "s3:PutObjectRetention",
                      "s3:PutObjectTagging",
                      "s3:PutObjectVersionTagging",
                      "s3:Abort*",
                    ],
                    "Effect": "Allow",
                    "Resource": [
                      {
                        "Fn::GetAtt": [
                          "Bucket83908E77",
                          "Arn",
                        ],
                      },
                      {
                        "Fn::Join": [
                          "",
                          [
                            {
                              "Fn::GetAtt": [
                                "Bucket83908E77",
                                "Arn",
                              ],
                            },
                            "/*",
                          ],
                        ],
                      },
                    ],
                  },
                ],
                "Version": "2012-10-17",
              },
              "PolicyName": "StreamProcessorFunctionServiceRoleDefaultPolicy558039BD",
              "Roles": [
                {
                  "Ref": "StreamProcessorFunctionServiceRole29022749",
                },
              ],
            },
            "Type": "AWS::IAM::Policy",
          },
          "TableCD117FA1": {
            "DeletionPolicy": "Retain",
            "Properties": {
              "AttributeDefinitions": [
                {
                  "AttributeName": "pk",
                  "AttributeType": "S",
                },
                {
                  "AttributeName": "sk",
                  "AttributeType": "S",
                },
              ],
              "BillingMode": "PAY_PER_REQUEST",
              "KeySchema": [
                {
                  "AttributeName": "pk",
                  "KeyType": "HASH",
                },
                {
                  "AttributeName": "sk",
                  "KeyType": "RANGE",
                },
              ],
              "StreamSpecification": {
                "StreamViewType": "NEW_AND_OLD_IMAGES",
              },
              "TimeToLiveSpecification": {
                "AttributeName": "ttl",
                "Enabled": true,
              },
            },
            "Type": "AWS::DynamoDB::Table",
            "UpdateReplacePolicy": "Retain",
          },
        },
        "Rules": {
          "CheckBootstrapVersion": {
            "Assertions": [
              {
                "Assert": {
                  "Fn::Not": [
                    {
                      "Fn::Contains": [
                        [
                          "1",
                          "2",
                          "3",
                          "4",
                          "5",
                        ],
                        {
                          "Ref": "BootstrapVersion",
                        },
                      ],
                    },
                  ],
                },
                "AssertDescription": "CDK bootstrap stack version 6 required. Please run 'cdk bootstrap' with a recent version of the CDK CLI.",
              },
            ],
          },
        },
      }
    `);
  });
});
