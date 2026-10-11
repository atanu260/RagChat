namespace RagChat.Infrastructure.Storage;

public sealed class LocalFileStorageOptions
{
    public const string SectionName = "Storage";

    public string RootPath { get; set; } = "App_Data/uploads";
}
