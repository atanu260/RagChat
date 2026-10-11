namespace RagChat.Api.Contracts;

/// <summary>JWT access token returned after registration or login.</summary>
public sealed record AuthTokenResponse(string AccessToken);
