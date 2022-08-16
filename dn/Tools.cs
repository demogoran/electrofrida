using HarmonyLib;

namespace dn
{
    static class LoggingType
    {
        public const string Info = "info";
        public const string Error = "error";
    }

    public class EFTools
    {
        public static string currentProcessName = "";

        public static object Get(object obj, string path)
        {
            var parts = path.Split('.');
            var newPath = string.Join(".", parts.Skip(1).ToArray());

            var result = Traverse.Create(obj).Field(parts[0]).GetValue();
            if (parts.Length == 1)
            {
                return result;
            }

            return Get(result, newPath);
        }

        public static void Log(string str, string type = LoggingType.Info)
        {
            FileLog.Log($"{DateTime.Now.ToString("MM/dd/yyyy H:mm")} [{type}]: [{currentProcessName}] {str}");
        }

        public static void AddHook<Original, Hook>(Harmony harmony, string originalName, string prefix = null, string postfix = null)
        {
            harmony.Patch(
                original: AccessTools.Method(typeof(Original), originalName),
                prefix: prefix != null ? new HarmonyMethod(typeof(Hook), prefix) : null,
                postfix: postfix != null ? new HarmonyMethod(typeof(Hook), postfix) : null
            );
        }
    }
}