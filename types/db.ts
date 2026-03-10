export interface UserRecord {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  preferences?: Record<string, unknown>;
  driveConnectionMeta?: Record<string, unknown>;
}

export interface ProjectRecord {
  id: string;
  userId: string;
  title: string;
  slug: string;
  goal?: string;
  targetPlatform?: string;
  sourceType: "upload" | "camera" | "mixed";
  activeVersionId: string | null;
  referenceBoardId: string | null;
  /** Per-project precision control values (e.g. shadowDepth, styleIntensity, skinNaturalness) 0–1 */
  precisionSettings?: Record<string, number>;
  trendSnapshot?: {
    styleTerm: string;
    confidence?: number;
    freshness?: string;
    interpretations?: string[];
    resolvedAt: string;
    traits: Record<string, unknown>;
    groundingSnippets?: Array<{ title: string; snippet: string; url: string }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssetRecord {
  id: string;
  projectId: string;
  userId: string;
  type: "upload" | "cameraCapture" | "reference" | "generated" | "export";
  storagePath: string;
  mimeType: string;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface VersionNodeRecord {
  id: string;
  projectId: string;
  userId: string;
  parentId: string | null;
  label: string;
  summary?: string;
  imageAssetId: string;
  toolName?: string;
  toolPayload?: Record<string, unknown>;
  referenceInputs?: string[];
  createdAt: string;
}

export interface ReferenceBoardRecord {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  summary?: string;
  extractedTraits?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceItemRecord {
  id: string;
  boardId: string;
  projectId: string;
  userId: string;
  type: "upload" | "screenshot" | "projectFrame" | "pastedUrl";
  assetId?: string;
  sourceUrl?: string;
  note?: string;
  tags?: string[];
  extractedSignals?: Record<string, unknown>;
  createdAt: string;
}

export interface BatchJobRecord {
  id: string;
  projectId: string;
  userId: string;
  masterVersionId: string;
  status: "pending" | "queued" | "running" | "completed" | "failed";
  settings?: Record<string, unknown>;
  samplePreviewIds?: string[];
  outputAssetIds?: string[];
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExportRecord {
  id: string;
  projectId: string;
  userId: string;
  preset: string;
  destination: "download" | "drive";
  driveFolderId?: string;
  shareLink?: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}

export interface RecipeRecord {
  id: string;
  userId: string;
  name: string;
  description?: string;
  previewAssetId?: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptTurnRecord {
  id: string;
  projectId: string;
  userId: string;
  speaker: "user" | "assistant";
  text: string;
  toolCalls?: Array<{ name: string; payload?: Record<string, unknown> }>;
  timestamps?: { start?: number; end?: number };
  createdAt: string;
}
