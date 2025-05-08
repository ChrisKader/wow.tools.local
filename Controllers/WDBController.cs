using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using wow.tools.local.Services;
using WoWFormatLib.FileReaders;

namespace wow.tools.local.Controllers
{

    [Route("wdb/")]
    [ApiController]
    public class WDBController : Controller
    {
        // Return a list of objects with fields containing the filedataid and name of the creature in JSON format.
        [Route("creature")]
        [HttpGet]
        public string CreatureById(int id)
        {
            var creatureInfo = SQLiteDB.GetCreatureInfoByID(id);
            if (creatureInfo != null) {
                // We need to create a new object to serialize, because the creatureInfo is a Dictionary<int, string> and we want to return a list of objects with fields containing the filedataid and name of the creature.
                var creatureList = new List<object>();
                foreach (var kvp in creatureInfo)
                {
                    var creature = new
                    {
                        filedataid = kvp.Key,
                        name = kvp.Value
                    };
                    creatureList.Add(creature);
                }
                return JsonConvert.SerializeObject(creatureList);
            }
            else
            {
                return JsonConvert.SerializeObject(new { error = "Creature not found" });
            }
        }

        [Route("creatures")]
        [HttpGet]
        public DataTablesResult CreatureTable(int draw, int start, int length)
        {
            var totalCount = SQLiteDB.GetCreatureCount();
            var result = new DataTablesResult()
            {
                draw = draw,
                recordsTotal = totalCount,
                recordsFiltered = totalCount,
                data = []
            };

            var results = SQLiteDB.GetCreatureNames(start, length);

            if (length == -1)
            {
                start = 0;
                length = results.Count;
            }

            foreach (var res in results)
            {
                result.data.Add(
                    [
                        res.Key.ToString(), // ID
                        res.Value, // Filename 
                    ]);
            }

            return result;
        }

        [Route("quests")]
        [HttpGet]
        public string QuestDebug()
        {
            var questWDB = WDBReader.Read("/Applications/World of Warcraft/_retail_/Cache/WDB/enUS/questcache.wdb", "11.0.2.56196");
            return JsonConvert.SerializeObject(questWDB);
            //return questWDB.entries.Aggregate("", (current, entry) => current + $"{entry.Key}: {entry.Value.Keys.Aggregate("", (curr, key) => curr + $"{key}: {entry.Value[key]}, ")}\n");
            //return questWDB.ToString();
        }
    }
}
