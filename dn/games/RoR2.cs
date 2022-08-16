using HarmonyLib;
using RoR2;

namespace dn.games
{
    public class RoR2
    {
        public static void ApplyPatches()
        {
            EFTools.Log("Apply ror2 patches");
            var harmony = new Harmony("com.ror2.patch");
            harmony.UnpatchAll("com.ror2.patch");


            EFTools.AddHook<SetGravity, RoR2Patch01>(harmony, "OnEnable", "Prefix");
        }
    }

    [HarmonyPatch(typeof(SetGravity), "OnEnable")]
    class RoR2Patch01
    {
        static public void Prefix()
        {
            EFTools.Log("Prefix called");
        }
    }
}