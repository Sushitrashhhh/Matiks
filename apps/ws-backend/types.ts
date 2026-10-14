import type { WebSocket } from "ws";

export type User = {
  id: string;
  name: string;
  ws: WebSocket;
};

export type questionSign = "PLUS" | "MINUS" | "MULTIPLICATION" | "DIVIDE";

export interface Question {
  id: string;
  operation1: number;
  operation2: number;
  sign: questionSign;
  answer: number;
}

export interface Answer {
  id: string;
  answer: number;
  questionId: string;
  userId?: string;
}

export type GameStatus = "SEARCHING_FOR_PLAYER" | "RUNNING" | "ENDED";

export type Game = {
  id: string;
  members: User[];
  adminId: string;
  status: GameStatus;
  questions: Question[];
  answers: Answer[];
};
