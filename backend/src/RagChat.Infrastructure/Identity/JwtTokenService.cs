using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RagChat.Application.Abstractions;
using RagChat.Domain.Entities;

namespace RagChat.Infrastructure.Identity;

public sealed class JwtTokenService(IOptions<JwtOptions> options) : IJwtTokenService
{
    public Task<string> GenerateTokenAsync(User user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        cancellationToken.ThrowIfCancellationRequested();

        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.SecretKey)
            || Encoding.UTF8.GetByteCount(settings.SecretKey) < 32)
        {
            throw new InvalidOperationException("The JWT secret key must contain at least 32 UTF-8 bytes.");
        }

        if (string.IsNullOrWhiteSpace(settings.Issuer) || string.IsNullOrWhiteSpace(settings.Audience))
        {
            throw new InvalidOperationException("JWT issuer and audience must be configured.");
        }

        if (settings.ExpirationMinutes <= 0)
        {
            throw new InvalidOperationException("JWT expiration must be greater than zero.");
        }

        var now = DateTime.UtcNow;
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.SecretKey)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: settings.Issuer,
            audience: settings.Audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Name, user.DisplayName),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            ],
            notBefore: now,
            expires: now.AddMinutes(settings.ExpirationMinutes),
            signingCredentials: credentials);

        return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
    }
}
