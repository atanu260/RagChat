using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RagChat.Api.Contracts;
using RagChat.Application.Auth.Commands;

namespace RagChat.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(ISender sender) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType<AuthTokenResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthTokenResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new RegisterCommand(request.Email, request.Password, request.DisplayName),
            cancellationToken);
        return Ok(new AuthTokenResponse(result.AccessToken));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType<AuthTokenResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthTokenResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new LoginCommand(request.Email, request.Password), cancellationToken);
        return Ok(new AuthTokenResponse(result.AccessToken));
    }
}
