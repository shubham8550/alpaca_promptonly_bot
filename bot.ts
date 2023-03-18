import * as dotenv from "dotenv";

dotenv.config();
import { io } from "socket.io-client";
import { Message, Client, TextChannel, MessageAttachment } from "discord.js";

export class Assistant {
  socket = io("ws://localhost:3000");

  client = new Client();

  constructor() {
    this.bot();

    this.client.login(process.env.TOKEN);
  }

  msglist = {};
  msgdata = {};
  tickskip = 0;
  bot = () => {
    this.socket.on("result", async (...args) => {
      let w: string = args[0]["response"];
      console.log(w);
      this.msgdata[args[0]["request"]["parentid"]] += w; // msg mearging heres
      this.msgdata[args[0]["request"]["parentid"]] = this.msgdata[
        args[0]["request"]["parentid"]
      ]
        .replaceAll("\\n", "\n")
        .replaceAll('\\\\\\""', '"');

      if (w.includes("<end>")) {
        //--
        this.msglist[args[0]["request"]["parentid"]].edit(
          this.msgdata[args[0]["request"]["parentid"]]
        );
        //--

        delete this.msglist[args[0]["request"]["parentid"]];
        delete this.msgdata[args[0]["request"]["parentid"]];

        return;
      } else {
        if (this.tickskip++ % 7 == 0) {
          if (this.msgdata[args[0]["request"]["parentid"]].trim() == "") return;
          this.msglist[args[0]["request"]["parentid"]].edit(
            this.msgdata[args[0]["request"]["parentid"]]
          );
        }
      }
    });

    this.client.on("ready", () => {
      console.log(`Logged in as ${this.client.user.tag}!`);
    });

    this.client.on("message", async (msg: Message) => {
      if (msg.author.bot) return;
      if (!this.msglist[msg.id]) {
        this.msgdata[msg.id] = "";

        this.msglist[msg.id] = await msg.reply("❥◕⩊◕🌸");
      }

      this.createCompletion(msg.content, msg.channel.id, msg.id);
    });
  };

  createCompletion = (
    prompt: string,
    channelid: string = "idhere",
    parentid: string = "id"
  ) => {
    console.log("emit request sock");
    console.log(prompt);
    prompt = prompt.replaceAll("\n", "\\n").replaceAll('"', '\\\\\\""');

    this.socket.emit("request", {
      channelid: channelid,
      parentid,
      seed: -1,
      threads: 4,
      n_predict: 200,
      top_k: 40,
      top_p: 0.9,
      temp: 0.1,
      repeat_last_n: 64,
      repeat_penalty: 1.3,
      debug: false,
      models: ["alpaca.7B"],
      model: "alpaca.7B",
      prompt: prompt, //.split("\n").join("\\n")
    });
  };
}
new Assistant();
