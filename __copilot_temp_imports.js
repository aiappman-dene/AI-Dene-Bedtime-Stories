import { body, validationResult } from "express-validator";
import fs from "fs";
import https from "https";
import crypto from "crypto";
import path from "path";
import {
  STORY_SYSTEM_PROMPT,
  EDITOR_SYSTEM_PROMPT,
  VALIDATOR_SYSTEM_PROMPT,
  DELIVERY_QA_SYSTEM_PROMPT,
} from "./prompts.js";
