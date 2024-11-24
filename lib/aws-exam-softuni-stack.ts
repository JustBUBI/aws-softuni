import * as cdk from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
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
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Lambda functions
    const fileUploadFunction = new NodejsFunction(this, "fileUploadFunction", {
      runtime: Runtime.NODEJS_20_X,
      entry: `${__dirname}/../src/fileUploadFunction.ts`,
      handler: "handler",
    });

    // Api Gateway
    const api = new RestApi(this, "ProcessorApi");
    const resource = api.root.addResource("fileUpload");
    resource.addMethod("POST", new LambdaIntegration(fileUploadFunction));

    // Outputs
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: fileMetadataTable.tableName,
    });
    new cdk.CfnOutput(this, "RestApiEndpoint", {
      value: `https://${api.restApiId}.execute-api.eu-central-1.amazonaws.com/prod/fileUpload`,
    });
  }
}
