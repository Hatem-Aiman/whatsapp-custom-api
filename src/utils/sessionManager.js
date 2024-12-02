import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';

class SessionManager {
  static saveSession(sessionId, session) {
    const sessionPath = path.resolve(`./sessions/${sessionId}.json`);
    writeFileSync(sessionPath, JSON.stringify(session));
  }

  static loadSession(sessionId) {
    const sessionPath = path.resolve(`./sessions/${sessionId}.json`);
    
    try {
      if (existsSync(sessionPath)) {
        const sessionData = readFileSync(sessionPath, 'utf8');
        return JSON.parse(sessionData);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
    return null;
  }
}

export default SessionManager;