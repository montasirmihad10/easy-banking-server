import { createLogger, format, transports } from "winston";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import { blue, green, red, yellowBright, magenta, yellow } from "colorette";

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const loggerTransports: transports.ConsoleTransportInstance[] = [
  new transports.Console({
    format: format.combine(format.colorize(), format.simple()),
  }),
];

// File logs only on writable local/dev disks — Vercel filesystem is read-only.
if (!isServerless) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DailyRotateFile = require("winston-daily-rotate-file");
    const logDirectory = path.join(__dirname, "logs");
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }
    loggerTransports.push(
      new DailyRotateFile({
        filename: path.join(logDirectory, "error-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        level: "error",
        format: format.combine(format.uncolorize(), format.json()),
      }),
      new DailyRotateFile({
        filename: path.join(logDirectory, "combined-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        format: format.combine(format.uncolorize(), format.json()),
      }),
    );
  } catch {
    // Keep console logging if file transports fail.
  }
}

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: loggerTransports,
});

export const logHttpRequests = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const colorizeByStatusCode = (statusCode: number) => {
      if (statusCode >= 200 && statusCode < 300) {
        return green(`${statusCode} 🎉`);
      } else if (statusCode >= 400 && statusCode < 500) {
        return red(`${statusCode} ⚠️`);
      } else if (statusCode >= 500) {
        return yellowBright(`${statusCode} 🔥`);
      }
      return blue(`${statusCode} ❗`);
    };

    const colorizeByMethod = (method: string) => {
      if (method === "GET") {
        return green(method + " 🔍");
      } else if (method === "POST") {
        return blue(method + " ✏️");
      } else if (method === "PATCH") {
        return yellowBright(method + " ✨");
      } else if (method === "PUT") {
        return yellow(method + " 🛠️");
      } else if (method === "DELETE") {
        return red(method + " ❌");
      }
      return magenta(method + " Unknown 😢☹️");
    };

    const clientIp = req.ip
      ? req.ip.startsWith("::ffff:")
        ? req.ip.substring(7)
        : req.ip
      : "Unknown IP";

    logger.info(
      `${colorizeByMethod(req.method)} ${req.originalUrl} ${colorizeByStatusCode(
        res.statusCode,
      )} ${Date.now() - startTime}ms - ${clientIp}`,
    );
  });

  next();
};
