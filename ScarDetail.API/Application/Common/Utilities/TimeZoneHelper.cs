namespace ScarDetail.API.Application.Common.Utilities;

public static class TimeZoneHelper
{
    private static readonly TimeZoneInfo SaoPauloTimeZone;

    static TimeZoneHelper()
    {
        try
        {
            SaoPauloTimeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        }
        catch (TimeZoneNotFoundException)
        {
            try
            {
                SaoPauloTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            }
            catch
            {
                SaoPauloTimeZone = TimeZoneInfo.CreateCustomTimeZone(
                    "America/Sao_Paulo",
                    TimeSpan.FromHours(-3),
                    "Brasilia Standard Time",
                    "Brasilia Standard Time");
            }
        }
    }

    public static TimeZoneInfo GetSaoPauloTimeZone() => SaoPauloTimeZone;

    public static DateTime ConvertToSaoPaulo(DateTime utcDateTime)
    {
        var utc = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
        return TimeZoneInfo.ConvertTimeFromUtc(utc, SaoPauloTimeZone);
    }

    public static DateTime ConvertToUtcFromSaoPaulo(DateTime localDateTime)
    {
        var unspecified = DateTime.SpecifyKind(localDateTime, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(unspecified, SaoPauloTimeZone);
    }

    public static DateTime NormalizeToUtc(DateTime dateTime) => dateTime.Kind switch
    {
        DateTimeKind.Utc => dateTime,
        DateTimeKind.Local => dateTime.ToUniversalTime(),
        _ => ConvertToUtcFromSaoPaulo(dateTime)
    };

    public static DateTime NowInSaoPaulo()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, SaoPauloTimeZone);
    }
}
