import * as cdk from "aws-cdk-lib";
import {
  CfnRestApi,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, StreamViewType, Table } from "aws-cdk-lib/aws-dynamodb";
import { FilterCriteria, FilterRule, Runtime, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

export class AwsExamSoftuniStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table
    const fileMetadataTable = new Table(this, "FileMetadataTable", {
      tableName: "FileMetadataTable",
      partitionKey: {
        name: "fileExtension",
        type: AttributeType.STRING,
      },
      sortKey: { name: "id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      stream: StreamViewType.NEW_IMAGE,
    });

    // SNS topic
    const fileUploadTopic = new Topic(this, "FileUploadTopic", {
      displayName: "FileUploadTopic",
    });
    // TODO: Change email to: hristo.zhelev@yahoo.com.
    fileUploadTopic.addSubscription(
      new EmailSubscription("lyubomir555@gmail.com")
    );

    // Lambda functions
    const fileUploadFunction = new NodejsFunction(this, "fileUploadFunction", {
      runtime: Runtime.NODEJS_20_X,
      entry: `${__dirname}/../src/fileUploadFunction.ts`,
      handler: "handler",
      environment: {
        TABLE_NAME: fileMetadataTable.tableName,
        TOPIC_ARN: fileUploadTopic.topicArn,
      },
    });
    
    const metadataStoredFunction = new NodejsFunction(this, "metadataStoredFunction", {
      runtime: Runtime.NODEJS_20_X,
      entry: `${__dirname}/../src/metadataStoredFunction.ts`,
      handler: "handler",
      environment: {
        TOPIC_ARN: fileUploadTopic.topicArn,
      },
    });
    metadataStoredFunction.addEventSource(
      new DynamoEventSource(fileMetadataTable, {
        startingPosition: StartingPosition.LATEST,
        batchSize: 5,
        filters: [
          FilterCriteria.filter({ eventName: FilterRule.isEqual("INSERT") }),
        ],
      })
    );

    // Grant permissions
    fileMetadataTable.grantReadWriteData(fileUploadFunction);
    fileMetadataTable.grantStreamRead(metadataStoredFunction);
    fileUploadTopic.grantPublish(fileUploadFunction);
    fileUploadTopic.grantPublish(metadataStoredFunction);

    // Api Gateway
    const api = new RestApi(this, "FileUploadApi");
    const resource = api.root.addResource("fileUpload");
    resource.addMethod(
      "POST",
      new LambdaIntegration(fileUploadFunction, { proxy: true })
    );

    // Enable Binary Media Types
    const cfnApi = api.node.defaultChild as CfnRestApi;
    cfnApi.addPropertyOverride("BinaryMediaTypes", ["multipart/form-data"]);

    // Outputs
    new cdk.CfnOutput(this, "DynamoDBTableName", {
      value: fileMetadataTable.tableName,
    });
    new cdk.CfnOutput(this, "RestApiEndpoint", {
      value: `https://${api.restApiId}.execute-api.eu-central-1.amazonaws.com/prod/fileUpload`,
    });
  }
}
