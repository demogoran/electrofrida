﻿using System.Reflection;
using HarmonyLib;

namespace dn;

public class HarmonyInitialPatcher
{
    // make sure DoPatching() is called at start either by
    // the mod loader or by your injector

    public static int DoPatching()
    {
        try{
            EFTools.Log("Starting");

            var harmony = new Harmony("com.starvalor.patch");
            harmony.UnpatchAll("com.starvalor.patch");
            var assembly = Assembly.GetExecutingAssembly();
            harmony.PatchAll(assembly);
            
            EFTools.Log("Started");
            return 1;   
        }
        catch (Exception ex)
        {
            EFTools.Log("Exception: " + ex.Message, LoggingType.Error);
            return 2;   
        }
    }
}

[HarmonyPatch(typeof(PlayerUIControl), nameof(PlayerUIControl.UpdateUI))]
class Patch01
{
    static bool Prefix(PlayerUIControl __instance)
    {
        try{
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

    static void Postfix()
    {
        //EFTools.Log("something");
    }
}



[HarmonyPatch(typeof(Crafting), nameof(Crafting.AddMaterialToList))]
class Patch02
{
    static bool Prefix(PlayerUIControl __instance, int ind, int qnt, List<CraftMaterial> mats)
    {
        try{
            //mats = new List<CraftMaterial>();
            var log = 
            $"AddMaterialToList: IND: {ind}, QNT: {qnt}, MATS: {string.Join("|",mats.Select(item=>$"{item.itemID}:{item.quantity}").ToArray())}";
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
class Patch03
{
    static List<CraftMaterial> Postfix(List<CraftMaterial> mats)
    {
        return mats.Select(mat=>{
            mat.quantity = 0;
            return mat;
        }).ToList();
    }
}