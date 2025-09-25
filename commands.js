import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

// Simple download command (link provided by env var)
const DOWNLOAD_COMMAND = {
  name: 'download',
  description: 'Avvia il download del file consentito (solo in una categoria specifica)',
  type: 1,
  // App in user and server integrations
  integration_types: [0, 1],
  // Limit to guild channels (we also re-check at runtime)
  contexts: [0],
};

const ALL_COMMANDS = [TEST_COMMAND, CHALLENGE_COMMAND, DOWNLOAD_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
