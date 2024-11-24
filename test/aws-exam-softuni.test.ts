import * as cdk from "aws-cdk-lib";
import * as AwsExamSoftuni from "../lib/aws-exam-softuni-stack";
import "jest-cdk-snapshot";

test("Lambda Function Created", () => {
  const app = new cdk.App();
  const stack = new AwsExamSoftuni.AwsExamSoftuniStack(app, "MyTestStack");
  expect(stack).toMatchCdkSnapshot();
});
