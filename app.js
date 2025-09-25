import 'dotenv/config';
import express from 'express';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest } from './utils.js';
import { getShuffledOptions, getResult } from './game.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              // Fetches a random emoji to send from a helper function
              content: `hello world ${getRandomEmoji()}`
            }
          ]
        },
      });
    }

    // "download" command
    if (name === 'download') {
      try {
        const allowedCategoryId = process.env.ALLOWED_CATEGORY_ID;
        const downloadUrl = process.env.DOWNLOAD_URL;

        if (!downloadUrl) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                {
                  type: MessageComponentTypes.TEXT_DISPLAY,
                  content: 'Configurazione mancante: DOWNLOAD_URL non impostato.'
                }
              ]
            }
          });
        }

        if (!allowedCategoryId) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                {
                  type: MessageComponentTypes.TEXT_DISPLAY,
                  content: 'Configurazione mancante: ALLOWED_CATEGORY_ID non impostato.'
                }
              ]
            }
          });
        }

        // Guild channel id where the command was used
        const channelId = req.body.channel?.id || req.body.channel_id;

        // If an allowed category is set, verify current channel's parent category
        if (allowedCategoryId && channelId) {
          // Fetch channel object
          const chanRes = await DiscordRequest(`channels/${channelId}`, { method: 'GET' });
          const channel = await chanRes.json();

          let categoryIdToCheck = null;
          // If it's a thread, channel.parent_id is the parent text channel; fetch it to get its category
          const THREAD_TYPES = [10, 11, 12, 15];
          if (THREAD_TYPES.includes(channel.type) && channel.parent_id) {
            const parentChanRes = await DiscordRequest(`channels/${channel.parent_id}`, { method: 'GET' });
            const parentChannel = await parentChanRes.json();
            categoryIdToCheck = parentChannel.parent_id ?? null;
          } else {
            // For normal channels, parent_id is the category id
            categoryIdToCheck = channel.parent_id ?? null;
          }

          if (categoryIdToCheck !== allowedCategoryId) {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
                components: [
                  {
                    type: MessageComponentTypes.TEXT_DISPLAY,
                    content: 'Questo comando può essere usato solo nella categoria autorizzata.'
                  }
                ]
              }
            });
          }
        }

        // Reply with the download link
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: 'Download pronto:'
              },
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.BUTTON,
                    style: ButtonStyleTypes.LINK,
                    label: 'Scarica file',
                    url: downloadUrl
                  }
                ]
              }
            ]
          }
        });
      } catch (err) {
        console.error('download command error', err);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: 'Si è verificato un errore durante l\'esecuzione del comando.'
              }
            ]
          }
        });
      }
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
