# Firestore indexes

Use these indexes for WazWuz when running with Firestore. Create them in the Firebase Console under Firestore → Indexes, or deploy via `firestore.indexes.json` if you use the Firebase CLI.

## projects

- **Collection:** `projects`
- **Fields:** `userId` (Ascending)
- **Query scope:** Collection
- **Usage:** List projects by user (`getProjectsByUserId`)

## assets

- **Collection:** `assets`
- **Fields:** `projectId` (Ascending), `userId` (Ascending)
- **Query scope:** Collection
- **Usage:** List assets by project (`getAssetsByProjectId`)

## versionNodes

- **Collection:** `versionNodes`
- **Fields:** `projectId` (Ascending), `userId` (Ascending)
- **Query scope:** Collection
- **Usage:** List version nodes by project (`getVersionNodesByProjectId`)

## referenceBoards

- **Collection:** `referenceBoards`
- **Fields:** `projectId` (Ascending), `userId` (Ascending)
- **Query scope:** Collection
- **Usage:** List reference boards by project (`getReferenceBoardsByProjectId`)

## referenceItems

- **Collection:** `referenceItems`
- **Fields:** `boardId` (Ascending), `userId` (Ascending)
- **Query scope:** Collection
- **Usage:** List reference items by board (`getReferenceItemsByBoardId`)

## batchJobs

- **Collection:** `batchJobs`
- **Fields:** `projectId` (Ascending), `userId` (Ascending)
- **Query scope:** Collection
- **Usage:** List batch jobs by project (`getBatchJobsByProjectId`)

## exports

- **Collection:** `exports`
- **Fields:** `projectId` (Ascending), `userId` (Ascending)
- **Query scope:** Collection
- **Usage:** List export records by project (`getExportsByProjectId`)

## transcriptTurns

- **Collection:** `transcriptTurns` (if used)
- **Fields:** `projectId` (Ascending), `userId` (Ascending)
- **Query scope:** Collection
- **Usage:** List transcript turns by project

## recipes

- **Collection:** `recipes`
- **Fields:** `userId` (Ascending)
- **Query scope:** Collection
- **Usage:** List recipes by user (`getRecipesByUserId`)
