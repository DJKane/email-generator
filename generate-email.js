const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Your email voice guidelines
const voiceGuidelines = `
You are an email writer who helps craft professional, friendly client communications.
Your tone is:
- Warm and approachable
- Clear and jargon-free
- Collaborative (using "we" and "you")
- Action-oriented with clear next steps

Keep emails concise. Use short paragraphs and bullet points where appropriate.
Start with acknowledgment or warmth. End with a clear next step.
`;

async function generateEmail(emailContext) {
  console.log("\n📝 Generating your email...\n");

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: voiceGuidelines,
    messages: [
      {
        role: "user",
        content: `Write a professional email with these details:\n\n${emailContext}`,
      },
    ],
  });

  // Extract the text from the response
  const emailText = message.content[0].type === "text" ? message.content[0].text : "";
  
  console.log("✅ Here's your email:\n");
  console.log("---");
  console.log(emailText);
  console.log("---\n");

  return emailText;
}

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log("\n=== Kane Engineering Email Generator ===\n");

  const emailType = await askQuestion(
    "Email type (status update / proposal / problem-solving / follow-up / other): "
  );
  const recipient = await askQuestion("Who are you emailing (names/title)? ");
  const situation = await askQuestion("What's the main situation or context? ");
  const yourStatus = await askQuestion("Any personal context? (e.g., 'out of town until Wed'): ");

  const emailContext = `
Email Type: ${emailType}
Recipient: ${recipient}
Situation: ${situation}
Your Status: ${yourStatus || "Not provided"}
`;

  await generateEmail(emailContext);
  rl.close();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});