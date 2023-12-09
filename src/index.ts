import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define the Message structure
type Message = Record<{
  id: string,
  email: string,
  language1: string,
  language2: string,
  comment: string,
  attachmentURL: string,
  createdAt: nat64,
  updatedAt: Opt<nat64>,
}>;

// Define the payload structure for adding a message
type MessagePayload = Record<{
  email: string,
  language1: string,
  language2: string,
  comment: string,
  attachmentURL: string,
}>;

// Initialize the message storage
const messageStorage = new StableBTreeMap<string, Message>(0, 44, 1024);

// Retrieve all messages
$query
export function getMessages(): Result<Vec<Message>, string> {
  try {
  return Result.Ok<Vec<Message>, string>(messageStorage.values());
} catch (error) {
  return Result.Err<Vec<Message>, string>(`Error retrieving message: ${error}`);
}
}

// Retrieve a specific message by ID
$query
export function getMessage(id: string): Result<Message, string> {
  try {
    // Validate ID
    if (id.trim() === '') {
      throw new Error('Invalid ID. ID must be a non-empty string.');
    }

    const messageOpt = messageStorage.get(id);

    return match(messageOpt, {
      Some: (message) => Result.Ok<Message, string>(message),
      None: () => Result.Err<Message, string>(`The message with id=${id} was not found`),
    });
  } catch (error) {
    return Result.Err<Message, string>(`Error retrieving message: ${error}`);
  }
}

// Add a new message
$update
export function addMessage(payload: MessagePayload): Result<Message, string> {
  try {
    // Validate payload

    if (!payload.email || !payload.language1 || !payload.language2 || !payload.comment || !payload.attachmentURL) {
      throw new Error('Invalid payload. All fields must be provided.');
    }

    const newMessage: Message = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: Opt.None,
      email: payload.email,
      language1: payload.language1,
      language2: payload.language2,
      comment: payload.comment,
      attachmentURL: payload.attachmentURL
    };

    messageStorage.insert(newMessage.id, newMessage);
    return Result.Ok<Message, string>(newMessage);
  } catch (error) {
    return Result.Err<Message, string>(`Error adding message: ${error}`);
  }
}

// Delete a specific message by ID
$update
export function deleteMessage(id: string): Result<Message, string> {
  try {
    // Validate ID
    if (id.trim() === '') {
      throw new Error('Invalid ID. ID must be a non-empty string.');
    }

    const deletedMessage = messageStorage.remove(id);

    return match(deletedMessage, {
      Some: (msg) => Result.Ok<Message, string>(msg),
      None: () => Result.Err<Message, string>(`The message with id=${id} was not found`),
    });
  } catch (error) {
    return Result.Err<Message, string>(`Error deleting message: ${error}`);
  }
}

// A workaround to make the uuid package work with Azle
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
