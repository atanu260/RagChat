using FluentAssertions;
using RagChat.Application.Documents.Commands;

namespace RagChat.Application.UnitTests.Documents;

public sealed class UploadDocumentCommandValidatorTests
{
    private const string PdfContentType = "application/pdf";
    private readonly UploadDocumentCommandValidator _validator = new();

    [Theory]
    [InlineData(1)]
    [InlineData(20 * 1024 * 1024)]
    public async Task ValidateAsync_ShouldAcceptFileWithinSizeLimit(long sizeBytes)
    {
        var result = await _validator.ValidateAsync(CreateCommand(sizeBytes, PdfContentType));

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(20 * 1024 * 1024 + 1)]
    public async Task ValidateAsync_ShouldRejectFileOutsideSizeLimit(long sizeBytes)
    {
        var result = await _validator.ValidateAsync(CreateCommand(sizeBytes, PdfContentType));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.PropertyName == nameof(UploadDocumentCommand.SizeBytes));
    }

    [Theory]
    [InlineData("application/pdf")]
    [InlineData("application/vnd.openxmlformats-officedocument.wordprocessingml.document")]
    [InlineData("text/plain")]
    public async Task ValidateAsync_ShouldAcceptSupportedContentTypes(string contentType)
    {
        var result = await _validator.ValidateAsync(CreateCommand(1024, contentType));

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("application/octet-stream")]
    [InlineData("image/png")]
    public async Task ValidateAsync_ShouldRejectUnsupportedContentTypes(string contentType)
    {
        var result = await _validator.ValidateAsync(CreateCommand(1024, contentType));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.PropertyName == nameof(UploadDocumentCommand.ContentType));
    }

    private static UploadDocumentCommand CreateCommand(long sizeBytes, string contentType) =>
        new(new MemoryStream([1]), "file.pdf", contentType, sizeBytes);
}
