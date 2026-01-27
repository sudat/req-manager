# Pinecone-MCP Command Reference

Here's a comprehensive reference of all available commands:

The Pinecone MCP server provides the following tools:
* `search-docs`: Search the official Pinecone documentation.
* `list-indexes`: Lists all Pinecone indexes.
* `describe-index`: Describes the configuration of an index.
* `describe-index-stats`: Provides statistics about the data in the index, including the number of records and available namespaces.
* `create-index-for-model`: Creates a new index that uses an integrated inference model to embed text as vectors.
* `upsert-records`: Inserts or updates records in an index with integrated inference.
* `search-records`: Searches for records in an index based on a text query, using integrated inference for embedding. Has options for metadata filtering and reranking.
* `cascading-search`: Searches for records across multiple indexes, deduplicating and reranking the results.
* `rerank-documents`: Reranks a collection of records or text documents using a specialized reranking model.
