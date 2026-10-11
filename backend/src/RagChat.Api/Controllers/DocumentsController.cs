using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RagChat.Application.Common;
using RagChat.Application.Documents.Commands;
using RagChat.Application.Documents.Queries;

namespace RagChat.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/documents")]
public sealed class DocumentsController(ISender sender) : ControllerBase
{
    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType<DocumentDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DocumentDto>> Upload(
        [FromForm] IFormFile file,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(file);

        await using var stream = file.OpenReadStream();
        var document = await sender.Send(
            new UploadDocumentCommand(stream, file.FileName, file.ContentType, file.Length),
            cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = document.Id }, document);
    }

    [HttpGet]
    [ProducesResponseType<IReadOnlyList<DocumentDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<DocumentDto>> GetAll(CancellationToken cancellationToken) =>
        sender.Send(new GetDocumentsQuery(), cancellationToken);

    [HttpGet("{id:guid}")]
    [ProducesResponseType<DocumentDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<DocumentDto> GetById(Guid id, CancellationToken cancellationToken) =>
        sender.Send(new GetDocumentByIdQuery(id), cancellationToken);

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteDocumentCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/reindex")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reindex(Guid id, CancellationToken cancellationToken)
    {
        await sender.Send(new ReindexDocumentCommand(id), cancellationToken);
        return Accepted();
    }
}
