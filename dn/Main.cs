using System.Reflection;
using HarmonyLib;


public class HarmonyInitialPatcher
{
    // make sure DoPatching() is called at start either by
    // the mod loader or by your injector

    public static int DoPatching()
    {
        try{
            FileLog.Log("Starting");

            var list = string.Join(",", AppDomain.CurrentDomain.GetAssemblies().Select((a)=>a.GetName()));
            FileLog.Log(list);

            var harmony = new Harmony("com.starvalor.patch");
            harmony.UnpatchAll("com.starvalor.patch");
            var assembly = Assembly.GetExecutingAssembly();
            harmony.PatchAll(assembly);
            FileLog.Log("Started");
            return 1;   
        }
        catch (Exception ex)
        {
            FileLog.Log("Exception: " + ex.Message);
            return 2;   
        }
    }
    
    public static void DoNothing()
    {
    }
}

public class FieldsTooling {

    public static object _get (object obj, string path) {
        var parts = path.Split('.');
        var newPath = string.Join(".", parts.Skip(1).ToArray());
        
        var result = Traverse.Create(obj).Field(parts[0]).GetValue();
        if(parts.Length == 1){
            return result;
        }

        return _get(result, newPath);
    }
}


[HarmonyPatch(typeof(PlayerUIControl), nameof(PlayerUIControl.UpdateUI))]
class Patch01
{
    static bool Prefix(PlayerUIControl __instance)
    {
        try{
            var currHP = FieldsTooling._get(__instance, "ss.currHP");   
            var baseHP = FieldsTooling._get(__instance, "ss.baseHP");   
            var currEnergy = FieldsTooling._get(__instance, "ss.stats.currEnergy");       

            var log = $"Stats: {currEnergy}, {currHP}/{baseHP}";
            //FileLog.Log(log);
        }
        catch (Exception ex)
        {
            FileLog.Log(ex.Message);
        }

        return true;
    }

    static void Postfix()
    {
        //FileLog.Log("something");
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
            FileLog.Log(log);
        }
        catch (Exception ex)
        {
            FileLog.Log(ex.Message);
        }

        return true;
    }

    static void Postfix()
    {
        //FileLog.Log("something");
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