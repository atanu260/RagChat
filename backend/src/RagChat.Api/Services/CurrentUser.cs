using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using RagChat.Application.Abstractions;

namespace RagChat.Api.Services;

public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public Guid UserId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? httpContextAccessor.HttpContext?.User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return Guid.TryParse(value, out var userId) ? userId : Guid.Empty;
        }
    }
}
