import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

const region = "eu-central-1";
const snsClient = new SNSClient({ region });
const allowedFileExtensions = ["pdf", "jpg", "png"];

function extractFileExtension(body: string) {
  // Use a regex to find the filename="..."
  const match = body.match(/filename="([^"]+)"/);
  if (match) {
    const filename = match[1]; // Extract the full filename
    const extension = filename.split(".").pop(); // Extract the file extension
    return extension;
  }
  return null; // Return null if no filename is found
}

export const handler = async (event: any) => {
  console.log(event);

  if (!event || !event.body) {
    return {
      statusCode: 400,
      body: "Bad request.",
    };
  }

  const rawBody = Buffer.from(event.body, "base64").toString("utf8");
  const fileExtension = extractFileExtension(rawBody);

  if (!fileExtension) {
    return {
      statusCode: 400,
      body: "Could not proccess file.",
    };
  }

  if (!allowedFileExtensions.includes(fileExtension)) {
    // File not allowed -> Notify via SNS
    try {
      const snsCommand = new PublishCommand({
        Message: `File with extension .'${fileExtension}' is not allowed.`,
        Subject: "Invalid file uploaded.",
        TopicArn: process.env.TOPIC_ARN,
      });
      await snsClient.send(snsCommand);
      console.log(`Warning sent to SNS.`);
    } catch (err) {
      console.error("Error sending message to SNS:", err);
    }
  } else {
    // File allowed -> Save in Dynamo
    console.log("YES");
  }

  return {
    statusCode: 200,
    body: "File proccessed.",
  };
};
