using dn;
using HarmonyLib;

namespace dn.games
{
    public class StarValor
    {
        public static void ApplyPatches()
        {
            var harmony = new Harmony("com.starvalor.patch");
            harmony.UnpatchAll("com.starvalor.patch");

            EFTools.AddHook<PlayerUIControl, StarValorPatch01>(harmony, "UpdateUI", "Prefix");
            EFTools.AddHook<Crafting, StarValorPatch02>(harmony, "AddMaterialToList", "Prefix");
            EFTools.AddHook<GenericCargoItem, StarValorPatch03>(harmony, "GetCraftingMaterials", null, "Postfix");
        }
    }
}


[HarmonyPatch(typeof(PlayerUIControl), nameof(PlayerUIControl.UpdateUI))]
class StarValorPatch01
{
    static bool Prefix(PlayerUIControl __instance)
    {
        try
        {
            var currHP = EFTools.Get(__instance, "ss.currHP");
            var baseHP = EFTools.Get(__instance, "ss.baseHP");
            var currEnergy = EFTools.Get(__instance, "ss.stats.currEnergy");

            var log = $"Stats: {currEnergy}, {currHP}/{baseHP}";
            EFTools.Log(log);
        }
        catch (Exception ex)
        {
            EFTools.Log(ex.Message, LoggingType.Error);
        }

        return true;
    }
}

[HarmonyPatch(typeof(Crafting), nameof(Crafting.AddMaterialToList))]
class StarValorPatch02
{
    static bool Prefix(PlayerUIControl __instance, int ind, int qnt, List<CraftMaterial> mats)
    {
        try
        {
            //mats = new List<CraftMaterial>();
            var log =
            $"AddMaterialToList: IND: {ind}, QNT: {qnt}, MATS: {string.Join("|", mats.Select(item => $"{item.itemID}:{item.quantity}").ToArray())}";
            EFTools.Log(log);
        }
        catch (Exception ex)
        {
            EFTools.Log(ex.Message);
        }

        return true;
    }

    static void Postfix()
    {
        //EFTools.Log("something");
    }
}



[HarmonyPatch(typeof(GenericCargoItem), nameof(GenericCargoItem.GetCraftingMaterials))]
class StarValorPatch03
{
    static List<CraftMaterial> Postfix(List<CraftMaterial> mats)
    {
        return mats.Select(mat =>
        {
            mat.quantity = 0;
            return mat;
        }).ToList();
    }
}