using HarmonyLib;

namespace dn
{
    static class LoggingType
    {
        public const string Info = "info";
        public const string Error = "error";
    }

    public class EFTools {

        public static object Get (object obj, string path) {
            var parts = path.Split('.');
            var newPath = string.Join(".", parts.Skip(1).ToArray());
            
            var result = Traverse.Create(obj).Field(parts[0]).GetValue();
            if(parts.Length == 1){
                return result;
            }

            return Get(result, newPath);
        }

        public static void Log(string str, string type = LoggingType.Info){
            FileLog.Log($"{DateTime.Now.ToString("MM/dd/yyyy H:mm")} [{type}] {str}");
        }
    }
}