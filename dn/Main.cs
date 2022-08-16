using System.Diagnostics;

namespace dn;

public class HarmonyInitialPatcher
{
    // make sure DoPatching() is called at start either by
    // the mod loader or by your injector

    public static int DoPatching()
    {
        try
        {
            var processName = Process.GetCurrentProcess().ProcessName;
            EFTools.currentProcessName = processName;
            EFTools.Log(processName);

            switch (processName)
            {
                case "Risk of Rain 2":
                    dn.games.RoR2.ApplyPatches();
                    break;
                case "Star Valor":
                    dn.games.StarValor.ApplyPatches();
                    break;
                default:
                    EFTools.Log("Wrong process name!", LoggingType.Error);
                    break;
            }

            return 1;
        }
        catch (Exception ex)
        {
            EFTools.Log("Exception: " + ex.Message, LoggingType.Error);
            return 2;
        }
    }
}
