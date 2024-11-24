import * as cdk from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class AwsExamSoftuniStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fileMetadataTable = new Table(this, "FileMetadataTable", {
      tableName: "FileMetadataTable",
      partitionKey: {
        name: "fileExtension",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Output for debugging
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: fileMetadataTable.tableName,
    });
  }
}
