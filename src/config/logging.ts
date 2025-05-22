import Transport from "winston-transport";
import supabase from "./supabaseConn";
import winston from "winston";
import { Request } from "express";

class SupabaseTransport extends Transport {
  async log(
    info: {
      level: string;
      message: string;
      context: string;
      meta?: {
        req?: { method: any; url: any };
        errorMsg?: string;
        stack?: string;
        additionalInfo?: {};
      };
    },
    callback: Function,
  ) {
    setImmediate(() => this.emit("logged", info));

    const { level, message, context, ...meta } = info;

    const { error } = await supabase
      .from("backend_logs")
      .insert([{ level, message, context, meta }]);

    if (error) {
      console.log("error while inserting log to supabase:", error.message);
    }
    callback();
  }
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new SupabaseTransport(),
  ],
});

export { logger };
