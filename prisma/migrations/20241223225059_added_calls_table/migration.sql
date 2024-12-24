-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "callType" TEXT,
    "accessToken" TEXT,
    "fromNumber" TEXT,
    "toNumber" TEXT,
    "direction" TEXT,
    "callStatus" TEXT NOT NULL,
    "metadata" JSONB,
    "retellLlmDynamicVariables" JSONB,
    "optOutSensitiveDataStorage" BOOLEAN,
    "startTimestamp" DOUBLE PRECISION,
    "endTimestamp" DOUBLE PRECISION,
    "transcript" TEXT,
    "transcriptObject" JSONB,
    "transcriptWithToolCalls" JSONB,
    "recordingUrl" TEXT,
    "publicLogUrl" TEXT,
    "e2eLatency" DOUBLE PRECISION,
    "llmLatency" DOUBLE PRECISION,
    "llmWebsocketNetworkRttLatency" DOUBLE PRECISION,
    "disconnectionReason" TEXT,
    "callSummary" TEXT,
    "inVoicemail" BOOLEAN,
    "userSentiment" TEXT,
    "callSuccessful" BOOLEAN,
    "customAnalysisData" JSONB,
    "transcriptWithTimestamp" JSONB,
    "noConversation" BOOLEAN,
    "loopsDetection" JSONB,
    "prematureEnding" JSONB,
    "longPauses" JSONB,
    "overlappingInterruptions" JSONB,
    "sentimentAnalysisRes" JSONB,
    "csatScore" DOUBLE PRECISION,
    "csatReasons" JSONB,
    "customerName" TEXT,
    "timestamp" TEXT,
    "status" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calls_callId_key" ON "calls"("callId");

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
