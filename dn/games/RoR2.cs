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


            EFTools.AddHook<CharacterBody, RoR2Patch01>(harmony, "get_experience", null, "Postfix");
        }
    }

    [HarmonyPatch(typeof(CharacterBody), "get_experience")]
    class RoR2Patch01
    {
        static public float Postfix(float __result)
        {
            EFTools.Log("Prefix called" + __result);
            return __result;
        }
    }
}