const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
require("dotenv").config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Path to your Obsidian vault
const OBSIDIAN_VAULT = "D:\\Obsidian\\Claude_Email";
const TEMPLATES_DIR = path.join(OBSIDIAN_VAULT, "email-templates");
const VOICE_GUIDELINES_DIR = path.join(OBSIDIAN_VAULT, "voice-guidelines");

// Read voice guidelines from Obsidian
function readVoiceGuidelines() {
  const voiceFile = path.join(VOICE_GUIDELINES_DIR, "kane-engineering-voice.md");
  try {
    const content = fs.readFileSync(voiceFile, "utf-8");
    return content;
  } catch (error) {
    console.error(`Error reading voice guidelines from ${voiceFile}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Read template from Obsidian based on email type
function readTemplate(emailType) {
  const templateFile = path.join(TEMPLATES_DIR, `${emailType}.md`);
  try {
    const content = fs.readFileSync(templateFile, "utf-8");
    return content;
  } catch (error) {
    console.error(`Error reading template for "${emailType}" from ${templateFile}`);
    console.error("Make sure the file exists in your Obsidian vault.");
    process.exit(1);
  }
}

async function generateEmail(emailType, emailContext, voiceGuidelines, template) {
  console.log("\n📝 Generating your email...\n");

  const systemPrompt = `${voiceGuidelines}

## Email Template Reference

${template}

Generate a professional email following these voice guidelines and the template structure provided. 
Fill in the bracketed placeholders with the actual information provided.
Keep it warm, clear, and action-oriented.`;

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Write a ${emailType} email with these details:\n\n${emailContext}`,
      },
    ],
  });

  const emailText =
    message.content[0].type === "text" ? message.content[0].text : "";

  console.log("✅ Here's your email:\n");
  console.log("---");
  console.log(emailText);
  console.log("---\n");

  return emailText;
}

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
  console.log("\n=== Kane Engineering Email Generator ===");
  console.log("(Reading templates from Obsidian)\n");

  const emailType = await askQuestion(
    "Email type (status update / proposal / problem-solving / follow-up): "
  );
  const recipient = await askQuestion(
    "Who are you emailing (names/title)? "
  );
  const situation = await askQuestion(
    "What's the main situation or context? "
  );
  const yourStatus = await askQuestion(
    "Any personal context? (e.g., 'out of town until Wed'): "
  );

  const emailContext = `
Recipient: ${recipient}
Situation: ${situation}
Your Status: ${yourStatus || "Not provided"}
`;

  try {
    // Read voice guidelines and template from Obsidian
    const voiceGuidelines = readVoiceGuidelines();
    
    // Convert spaces to hyphens (e.g., "status update" → "status-update")
    const emailTypeFormatted = emailType.toLowerCase().replace(/ /g, "-");
    const template = readTemplate(emailTypeFormatted);

    // Generate the email
    await generateEmail(emailType, emailContext, voiceGuidelines, template);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  rl.close();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});