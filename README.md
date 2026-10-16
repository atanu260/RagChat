# RagChat: Chat with your Documents

A Retrieval-Augmented Generation (RAG) application. Upload PDF, DOCX or text files, then ask questions in a chat interface. Answers are generated from your documents and come with citations that point back to the source chunks.

**Stack:** .NET 10 (Clean Architecture) | SQL Server | Azure OpenAI | Angular (planned)

---

## Features

- JWT authentication with per-user data isolation
- Document upload with background ingestion (parse, chunk, embed, store)
- Sentence-aware chunking with configurable size and overlap
- Vector similarity search over document chunks (cosine similarity)
- Streaming answers over Server-Sent Events (SSE)
- Source citations on every answer
- Global exception handling, correlation IDs and rate limiting
- OpenAPI document with a Scalar UI for testing

## How it works

```
Upload ──► Save file ──► Queue job ──► Parse ──► Chunk ──► Embed ──► Store in SQL Server
                                                                         │
Question ──► Embed question ──► Top-K similarity search ◄────────────────┘
                                        │
                      Build prompt with numbered context chunks
                                        │
                  Azure OpenAI streams the answer ──► Client (SSE) + citations
```

1. **Ingestion (async):** an upload returns immediately. A background worker parses the file, splits it into overlapping chunks, creates embeddings in batches and stores them. The document status moves through `Uploaded`, `Processing`, then `Ready` or `Failed`.
2. **Retrieval:** the question is embedded, and the top matching chunks are fetched for the current user only.
3. **Generation:** a prompt instructs the model to answer only from the supplied context, cite sources as [1], [2], and say it doesn't know when the context is insufficient.

## Architecture

```
backend/
├── src/
│   ├── RagChat.Domain          # Entities, enums, value objects (no dependencies)
│   ├── RagChat.Application     # Use cases (MediatR), interfaces, prompt building, ingestion
│   ├── RagChat.Infrastructure  # EF Core, Azure OpenAI, vector store, parsers, background jobs
│   └── RagChat.Api             # Controllers, middleware, auth, OpenAPI
└── tests/                      # Unit and integration tests (xUnit)
```

Dependency rule: `Domain` depends on nothing, `Application` depends on `Domain`, `Infrastructure` and `Api` depend on `Application`.

All external concerns sit behind interfaces in `Application/Abstractions` (`IEmbeddingService`, `IChatCompletionService`, `IVectorStore`, `IDocumentParser`, `IChunkingStrategy`, `IFileStorage`). The vector store, for example, can be swapped for SQL Server's native vector type or Azure AI Search without touching business logic.

## Database

| Table | Purpose |
|---|---|
| `Users` | Accounts |
| `Documents` | Uploaded files and their processing status |
| `DocumentChunks` | Chunk text, page number and embedding |
| `ChatSessions` | Conversations |
| `ChatMessages` | User and assistant messages |
| `MessageCitations` | Which chunks supported which answer |

## Getting started

### Prerequisites

- .NET 10 SDK
- SQL Server (Express or LocalDB)
- An Azure OpenAI resource with one embedding deployment and one chat deployment
- Node.js (for the Angular frontend, once added)

### 1. Configure the connection string

Set `ConnectionStrings:Default` in `backend/src/RagChat.Api/appsettings.json`.

Note: `appsettings.Development.json` overrides `appsettings.json` when running in Development, so update both if they differ.

```json
"ConnectionStrings": {
  "Default": "Server=localhost\\SQLEXPRESS;Database=RagChat;Trusted_Connection=True;TrustServerCertificate=True"
}
```

### 2. Set secrets

Secrets are stored with .NET user-secrets, never in the repo:

```bash
cd backend/src/RagChat.Api
dotnet user-secrets init
dotnet user-secrets set "Jwt:SecretKey" "<random string, 32+ characters>"
dotnet user-secrets set "AzureOpenAI:Endpoint" "https://<your-resource>.openai.azure.com/"
dotnet user-secrets set "AzureOpenAI:ApiKey" "<your key>"
dotnet user-secrets set "AzureOpenAI:EmbeddingDeployment" "<embedding deployment name>"
dotnet user-secrets set "AzureOpenAI:ChatDeployment" "<chat deployment name>"
```

### 3. Create the database

From the `backend` folder:

```bash
dotnet ef database update -p src/RagChat.Infrastructure -s src/RagChat.Api
```

Or in Visual Studio's Package Manager Console:

```
Update-Database -Project RagChat.Infrastructure -StartupProject RagChat.Api
```

To add a new migration after changing entities:

```bash
dotnet ef migrations add <Name> -p src/RagChat.Infrastructure -s src/RagChat.Api -o Persistence/Migrations
```

### 4. Run the API

```bash
cd backend/src/RagChat.Api
dotnet run --launch-profile https
```

| Item | URL |
|---|---|
| API (https) | https://localhost:7015 |
| API (http) | http://localhost:5136 |
| Scalar UI | https://localhost:7015/scalar/v1 |
| OpenAPI JSON | https://localhost:7015/openapi/v1.json |
| Health check | https://localhost:7015/health |

If the browser warns about the certificate, run `dotnet dev-certs https --trust` once.

## API overview

Check the Scalar UI for the authoritative list. The main endpoints are:

| Area | Endpoint |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Documents | `POST /api/documents`, `GET /api/documents`, `GET /api/documents/{id}`, `DELETE /api/documents/{id}`, `POST /api/documents/{id}/reindex` |
| Chat | `POST /api/chat/sessions`, `GET /api/chat/sessions`, `GET /api/chat/sessions/{id}/messages`, `POST /api/chat/sessions/{id}/ask` (SSE stream) |

All endpoints except register and login require a `Authorization: Bearer <token>` header.

## Testing the API

1. Register, then log in and copy the token.
2. Upload a document (multipart form, field name `file`).
3. Poll `GET /api/documents/{id}` until `status` is `Ready`.
4. Create a chat session, then call the `ask` endpoint with a question.

For the streaming `ask` endpoint, `curl` shows tokens live:

```bash
curl -N -k -X POST "https://localhost:7015/api/chat/sessions/<sessionId>/ask" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question":"What is this document about?"}'
```

Run the automated tests with:

```bash
cd backend
dotnet test
```

## Design decisions

| Decision | Why |
|---|---|
| Clean Architecture with MediatR | Keeps business logic independent of EF Core, Azure and HTTP, and easy to unit test |
| Background ingestion via a channel queue and worker | Uploads return fast, and slow parse and embed work doesn't block requests |
| Chunks of ~500 tokens with ~50 overlap | Balances retrieval precision against context loss at chunk boundaries |
| Vector store behind an interface | SQL Server is simple to run locally; the implementation can move to native vectors or Azure AI Search |
| Filtering by user before similarity search | Guarantees users only ever retrieve their own documents |
| SSE for streaming | One-way token streaming is simpler than WebSockets and works over plain HTTP |

## Roadmap

- [ ] Angular frontend (document list and upload, streaming chat UI, citation panel)
- [ ] Docker Compose (API, SQL Server, frontend)
- [ ] CI/CD pipeline and Azure deployment
- [ ] Native SQL Server vector search or Azure AI Search implementation
- [ ] Integration tests with Testcontainers

## Author

Atanu | [GitHub](https://github.com/atanu260) | [LinkedIn](https://linkedin.com/in/atanu-chowdhary/)
