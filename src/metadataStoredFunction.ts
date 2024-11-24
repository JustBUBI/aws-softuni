import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

const region = "eu-central-1";
const snsClient = new SNSClient({ region });

export const handler = async (event: any) => {
  console.log(event);

  if (!event) {
    return {
      statusCode: 400,
      body: "Bad request.",
    };
  }

  const newItem = event.Records[0].dynamodb;
  const fileExtension = newItem.NewImage.fileExtension.S;
  const dateUploaded = newItem.NewImage.dateUploaded.S;

  try {
    const snsCommand = new PublishCommand({
      Message: `A new file has been added: \n
            fileExtension: ${fileExtension} \n
            dateUploaded: ${dateUploaded}`,
      Subject: "New file has been added.",
      TopicArn: process.env.TOPIC_ARN,
    });
    await snsClient.send(snsCommand);
    console.log(`New item info sent via SNS.`);
  } catch (err) {
    console.error("Error sending message to SNS:", err);
  }

  return {
    statusCode: 200,
    body: "Request processed.",
  };
};
