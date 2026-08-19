import * as Winston from 'winston';

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  return JSON.stringify(value);
};

/** Format console lisible : `timestamp [context] level: message {metadata}`. */
export const humanReadableFormat = (): Winston.Logform.Format =>
  Winston.format.printf(
    ({ timestamp, level, message, context, ...metadata }) => {
      const contextText = toText(context) || 'Application';
      let msg = `${toText(timestamp)} [${contextText}] ${level}: ${toText(message)}`;
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      return msg;
    },
  );
