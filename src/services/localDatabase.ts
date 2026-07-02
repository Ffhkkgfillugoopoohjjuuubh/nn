import * as SQLite from 'expo-sqlite/legacy';
import { LocalChat, LocalMessage } from '../types';

let db: SQLite.WebSQLDatabase;

export const initDatabase = async (): Promise<void> => {
  db = SQLite.openDatabase('quarisme.db');

  await new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS local_chats (
          id TEXT PRIMARY KEY,
          contact_name TEXT NOT NULL,
          contact_phone TEXT NOT NULL,
          last_message TEXT DEFAULT '',
          last_message_time INTEGER DEFAULT 0,
          unread_count INTEGER DEFAULT 0
        )`,
        [],
        () => {},
        (_, error) => {
          reject(error);
          return false;
        }
      );
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS local_messages (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL,
          sender_id TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          is_sent INTEGER DEFAULT 0,
          is_read INTEGER DEFAULT 0,
          delivery_status TEXT DEFAULT 'sent'
        )`,
        [],
        () => {},
        (_, error) => {
          reject(error);
          return false;
        }
      );
    }, reject, resolve);
  });

  await migrateV2();
};

async function migrateV2(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql('ALTER TABLE local_messages ADD COLUMN edited_at INTEGER DEFAULT 0', [], () => {}, () => false);
      tx.executeSql('ALTER TABLE local_messages ADD COLUMN is_edited INTEGER DEFAULT 0', [], () => {}, () => false);
      tx.executeSql('ALTER TABLE local_messages ADD COLUMN is_deleted_for_me INTEGER DEFAULT 0', [], () => {}, () => false);
    }, reject, resolve);
  });
};

// ---- CHATS ----

export const getAllChats = async (): Promise<LocalChat[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM local_chats ORDER BY last_message_time DESC',
        [],
        (_, { rows }) => resolve(rows._array as LocalChat[]),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getChatById = async (chatId: string): Promise<LocalChat | null> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM local_chats WHERE id = ?',
        [chatId],
        (_, { rows }) => resolve(rows.length > 0 ? (rows.item(0) as LocalChat) : null),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const upsertChat = async (chat: LocalChat): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT OR REPLACE INTO local_chats (id, contact_name, contact_phone, last_message, last_message_time, unread_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [chat.id, chat.contact_name, chat.contact_phone, chat.last_message, chat.last_message_time, chat.unread_count],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const updateChatLastMessage = async (
  chatId: string,
  lastMessage: string,
  timestamp: number,
  incrementUnread: boolean
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE local_chats SET last_message = ?, last_message_time = ?, unread_count = unread_count + ? WHERE id = ?`,
        [lastMessage, timestamp, incrementUnread ? 1 : 0, chatId],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const markChatRead = async (chatId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE local_chats SET unread_count = 0 WHERE id = ?',
        [chatId],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

// ---- MESSAGES ----

export const getMessagesForChat = async (chatId: string): Promise<LocalMessage[]> => {
  const rows = await new Promise<LocalMessage[]>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM local_messages WHERE chat_id = ? ORDER BY timestamp ASC',
        [chatId],
        (_, { rows }) => resolve(rows._array as LocalMessage[]),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
  return rows.filter(m => !m.is_deleted_for_me);
};

export const insertMessage = async (message: LocalMessage): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT OR REPLACE INTO local_messages (id, chat_id, sender_id, content, timestamp, is_sent, is_read, delivery_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [message.id, message.chat_id, message.sender_id, message.content, message.timestamp, message.is_sent, message.is_read, message.delivery_status],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const updateMessageStatus = async (
  messageId: string,
  status: string,
  isRead?: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE local_messages SET delivery_status = ?${isRead !== undefined ? ', is_read = ?' : ''} WHERE id = ?`,
        isRead !== undefined ? [status, isRead, messageId] : [status, messageId],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const markMessagesAsRead = async (chatId: string, senderId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE local_messages SET is_read = 1 WHERE chat_id = ? AND sender_id = ? AND is_read = 0',
        [chatId, senderId],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const updateMessageDeliveryStatus = async (
  messageId: string,
  status: string,
  isRead?: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE local_messages SET delivery_status = ?${isRead !== undefined ? ', is_read = ?' : ''} WHERE id = ?`,
        isRead !== undefined ? [status, isRead, messageId] : [status, messageId],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const deleteMessageById = async (messageId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM local_messages WHERE id = ?',
        [messageId],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const softDeleteMessageForMe = async (messageId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE local_messages SET is_deleted_for_me = 1 WHERE id = ?',
        [messageId],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const editMessageLocal = async (messageId: string, content: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE local_messages SET content = ?, is_edited = 1, edited_at = ? WHERE id = ?',
        [content, Date.now(), messageId],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const updateMessageContent = async (messageId: string, content: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE local_messages SET content = ? WHERE id = ?',
        [content, messageId],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getMessageById = async (messageId: string): Promise<LocalMessage | null> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM local_messages WHERE id = ?',
        [messageId],
        (_, { rows }) => resolve(rows.length > 0 ? (rows.item(0) as LocalMessage) : null),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

// ---- PENDING MESSAGES (offline queue) ----

export const getPendingMessages = async (): Promise<LocalMessage[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        "SELECT * FROM local_messages WHERE delivery_status = 'sending' ORDER BY timestamp ASC",
        [],
        (_, { rows }) => resolve(rows._array as LocalMessage[]),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};
