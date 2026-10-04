/**
 * 一次性加厚 xianxia.overlay.json 主线 dialogueBeats（≥5 line/节点）
 * 运行：node scripts/apply-xianxia-dialogue-full.mjs && npm run story-gen-quality
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'src/narrative/officialPacks/xianxia.overlay.json');
const overlay = JSON.parse(readFileSync(path, 'utf8'));

/** @type {Record<string, { blurb?: string, dialogueBeats: unknown[] }>} */
const PATCH = {
  ch1_n3: {
    blurb:
      '关外营地营火渐起，云栈渡来的风仍带潮气。谢鸣桡收卷：盾墙既破，记名符亮了一线；明日入迷瘴林，韩承夜不会等你悟第二遍。守心二字，今夜落地。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '界域关隘这一关，你破的是盾，不是嘴。营火边歇一夜，记名符别离身——符在，行迹在。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '明日迷瘴林。韩承夜已在册上，席次之争从林里算起，不是从关前。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '守心……是阵不乱，还是心不乱？',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '都算。云栈渡送你进来，不是送你逞能。林里有分兵之计，别让我替你收残阵。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '符在袖里。明日见林，也见同辈。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '歇足。关丁已让出箭道，别在关前久留——迷瘴林的雾，比关隘的灵雾更认人心。',
      },
    ],
  },
  ch1_n5: {
    blurb:
      '记名符在掌心温了一线，像云栈渡的潮气还没散尽。谢鸣桡指林道：同辈不会等你，入局只是开始。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '符光稳了，册上才有你一笔。下一程林道，同辈韩承夜不会等你慢慢悟。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '册上有他，也会有我。记名符我收好了。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '好。迷瘴林考阵脚，不考口舌——你若还想着关前那套慢磨，初规二字会教你改。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '云栈渡送我进来，不是送我退场。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '明日天亮入林。守心，别守嘴硬。',
      },
    ],
  },
  ch2_n3: {
    blurb:
      '林道岔口伏兵退去，乱阵脚印纵横。韩承夜在远处冷笑；谢鸣桡敲木鱼三下，入局那课「勿中分兵」又在耳边。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '脚印乱成这样，你还跟得上节奏？迷瘴林不是界域关隘，盾墙救不了你第二次。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '主路在我。风随便吹，阵不乱。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '入局那符还在袖里？听见没有——勿中分兵之计。韩承夜，席次去试剑台争，别在岔口耍心机。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '谢执事护得紧。{{heroName}}，初规在此，看你跟不跟得上。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '云栈渡记名符还温。我跟的是阵，不是你的冷笑。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '继续主路。林尽处高台在望，远锋之约从下一章算起——别在岔口耗干力气。',
      },
    ],
  },
  ch2_n5: {
    blurb:
      '林尽处灵墟坊方向高台在望，远矢之约将至。韩承夜收剑意半步：试剑台见。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '迷瘴林走到这里，算你阵脚没散。试剑台远锋之约，柳望虚亲自立规。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '初规我记下了。近身破阵不够，还要切后？',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '箭雨不切，传功殿不记名。灵墟坊钟鸣一响，你就没借口说「只会破盾」。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '册上不止你一笔。远锋我接。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '接得住再说。我在观台，剑不出鞘——等你漏一步。',
      },
    ],
  },
  ch3_n1: {
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '初规之后，试剑台设远锋。你近身破阵再漂亮，箭雨不切，传功殿也不会记名。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '灵墟坊钟鸣未散。远锋试你哪一种本事——穿透，还是耐心？',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '阵脚若乱，切后也是送。我先稳，再撕后排。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '说得漂亮。弓阵开时，别求我替你挡箭。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '约立在此。试剑台只记阵脚，不记嘴硬——韩承夜，观台安分。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '远锋我接。箭雨来多少，我拆多少。',
      },
    ],
  },
  ch3_n3: {
    blurb:
      '试剑台侧弓阵既破，灵墟坊有人递话：别在高台耗干力气，灵石营等着整备。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '远锋一役，箭道你撕开了。弦歇一刻，别在试剑台把灵息耗尽。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '灵墟坊那头要整备？',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '灵石营苏衔青在等。回气、换阵提示，比你在台上逞能实在。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '近身破了，切后也见了。下一程我听营里的规矩。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '好。名册上会多你一笔——也会多你对手一笔。别得意太早。',
      },
    ],
  },
  ch3_n5: {
    blurb:
      '试剑台远锋约成，灵墟坊名册上多了你一笔，也多了对手一笔。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '约成。试剑台远锋，记的是阵脚，不是一场输赢。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '册上名字挨着了。下一阵若在营外还磨不动盾，别怪箭雨再来一遍。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '初规、远锋都走过。整备之后，我换阵，不换心。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '灵石营见。苏衔青嘴碎，话里有一句是真的：同一法门三番，长老会厌。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '记下了。灵墟坊灯火还亮，我不在台上过夜。',
      },
    ],
  },
  ch4_n3: {
    blurb:
      '灵石营名册投影亮起，柳望虚道：能打的兄弟要在阵上才算数。苏衔青在一旁数丹炉。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '远锋之后整备在此。名册投影——名上有光也有暗，能打的要在阵上才算数。',
      },
      {
        kind: 'line',
        speaker: '苏衔青',
        text: '游方丹师摆摊，不赊账。回气、换阵提示，卡关别跟盾墙赌气。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '名册上暗处，是劫灰原那种，还是人心那种？',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '你问得早。先把构筑验完——整备之后才是高压。',
      },
      {
        kind: 'line',
        speaker: '苏衔青',
        text: '长老说话我插一句：换阵比换命便宜，灵墟坊的灵石营就这一摊实在买卖。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '灵息补回来，阵再谈。',
      },
    ],
  },
  ch4_n5: {
    blurb:
      '灵石营阶段目标落下：再往前是天阙城劫灰原，不会跟你讲情面。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '整备告一段落。阶段目标落下：天阙城劫灰原，不会跟你讲情面。',
      },
      {
        kind: 'line',
        speaker: '苏衔青',
        text: '丹炉收摊前说一句——猎装不够就去刷，别进灰原硬撑面子。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '远锋教的切后，营里教的换阵，我都带着。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '高压伤的不只是血，是册上信誉。韩承夜会在原上等。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '灵墟坊灯火在背后，我不回头逞能。',
      },
    ],
  },
  ch5_n1: {
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '劫灰原的风带灰，也带话——整备之后，席次不是请客吃饭。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '天阙城云低。这一阵轮换加压，伤的是册上信誉，不是一时输赢。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '轮换来多少，我接多少。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '硬扛、换阵、暂避，选哪种都行。别选第四种：逃。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '记名符在，我不会逃回云栈渡。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '好。灰里藏刃，别先崩心——卷途尚半，望劫亭还在前头。',
      },
    ],
  },
  ch5_n3: {
    blurb:
      '劫灰原乱战方歇，远处灵障光晕起伏，像有人在劫域门后调阵。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '高压这一段，你撑住了。乱战方歇，别在灰原恋战——灵障光晕在起伏。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '门后有人在调阵？',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '猜对了也没奖。天阙城望劫亭在前，半程歇点——柳望虚要复盘，谢鸣桡要收行迹。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '信誉伤了一点，阵还在。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '半程见。届时别问我劫域门后是什么——我也不知道，只知道册上不能乱。',
      },
    ],
  },
  ch5_n5: {
    blurb:
      '劫灰原高压一段撑过，卷中点尚远——望劫亭半程歇点在前。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '整备之后你在灰原没丢阵，算你一句。可卷中点尚远，望劫亭才是半程。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '高压我记取了。下一程歇脚，还是再战？',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '柳望虚和谢鸣桡在亭上等。你若还想嘴硬，去亭上跟长老说。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '天阙城风压着脸，我不在灰原过夜。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '走。半程落定之前，别问我门后有什么——问也问不出。',
      },
    ],
  },
  ch6_n1: {
    blurb:
      '望劫亭半程歇点，谢鸣桡复盘行迹，柳望虚按住追问：卷途尚半，劫域门后此刻不揭底。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '天阙城望劫亭。高压之后，行迹摊开——你每一阵，符上都有回声。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '劫域门后，到底是什么？',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '问得急。卷途尚半，此刻不揭底——你想听答案，先过二重天阙。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '半程不是终章。前半得失，在此落定；后半开门、暗线，各算各的账。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '符还在袖里。我不逼问，也不装懂。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '好。亭外余波会来——那是试阵，不是卷终。守心二字，半程才算写全。',
      },
    ],
  },
  ch6_n3: {
    blurb:
      '望劫亭半程，谢鸣桡问接下来先稳心还是先破阵；柳望虚不语，等你自己选语气。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '半程歇脚，不是躺平。下一程二重天阙开门，你打算先稳什么？',
      },
      {
        kind: 'choice',
        speaker: '谢鸣桡',
        prompt: '望劫亭风很硬。你先稳哪一条？',
        options: [
          {
            label: '先稳阵脚',
            reply: '阵脚不稳，开门也是送。我先稳阵。',
          },
          {
            label: '先稳心诀',
            reply: '心先乱，手必乱。我先守心。',
          },
        ],
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '选哪种都行——变的是你后半程说话的底气，不变的是阵上要过的关。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '高压之后，别在亭前恋战。余波会来，试的是破盾节奏，不是席次。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '卷途尚半。我记住了。',
      },
    ],
  },
  ch6_n5: {
    blurb:
      '望劫亭歇足再发，二重天阙在望，关规将与界域关隘不同。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '歇够了就起身。二重天阙开门，关规与界域关隘不同——别带旧侥幸。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '半程之后，名册上仍看你阵脚。苏衔青在阙前还有最后一炉丹。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '旧法不够，我换阵，不换记名。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '记名符别丢。韩承夜若在侧翼，仍是试心，不是试嘴。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '走。天阙城风会教你什么叫「开门」。',
      },
    ],
  },
  ch6_n7: {
    blurb:
      '望劫亭半程落定：门线在前，暗线在后，卷途尚半。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '半程落定。前半行迹收卷——云栈渡到望劫亭，每一阵都算数。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '门线在前，暗线在后。劫域关尚远，别在亭前把灵息耗干。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '高压撑过来了。下一程开门，我接新规。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '好。二重天阙计时一开，别让我看见你还在用入局的慢磨。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '卷途尚半。守心——后半程比前半更窄。',
      },
    ],
  },
  ch7_n1: {
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '半程之后，二重天阙的关规在此。开门不是换地名，是换你脑子里那套侥幸。',
      },
      {
        kind: 'line',
        speaker: '苏衔青',
        text: '阙前最后一炉丹。旧法不够，莫硬闯——硬闯的不算我的客。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '新关规，新阵。开门这一课，我记下了。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '记名符别丢。门线计时一开，侧翼仍是试心。',
      },
      {
        kind: 'line',
        speaker: '苏衔青',
        text: '天阙城风硬。丹收摊后，阵上只剩你们自己。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '灵伤、破甲，我按提示换。硬闯不算数。',
      },
    ],
  },
  ch7_n3: {
    blurb:
      '二重天阙内层回廊第一条律：不认关外侥幸，旧法须换。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '入关。二重天阙内层回廊——第一条律：不认关外侥幸。',
      },
      {
        kind: 'line',
        speaker: '苏衔青',
        text: '丹炉空了，话还在：开门之后，别用整备前的老阵硬顶物防。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '半程教的守心，这里教换律。我分得清。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '门线守阵不讲旧情。灵伤或裂甲，去镜渊试炼也不丢人。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '天阙城风从门缝灌进来——我接得住。',
      },
    ],
  },
  ch7_n5: {
    blurb:
      '二重天阙门线既过，劫域关方向暗线将在内府露头。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '门线既过。深线已开——劫域关内府，不认席次，认行迹。',
      },
      {
        kind: 'line',
        speaker: '苏衔青',
        text: '我收摊往回了。暗线里别乱吃丹，来路不明的更别碰。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '开门之后，影子比剑多。我记着望劫亭的教训。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '莫隐舟若在暗处递诀，先想韩承夜会怎么试你心镜。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '记名符在。暗线我走，席次战后算。',
      },
    ],
  },
  ch8_n1: {
    blurb:
      '劫域关内府秘径，莫隐舟一闪而过，半页心诀来路不明；韩承夜冷眼：先揭底者出局。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '莫隐舟',
        text: '开门之后，内府秘径窄。心诀半页，来路你别问太细——问细了，册上先暗一笔。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '蒙面也好，实名也好。暗线试心镜，不为争席——先揭底者出局。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '诀在袖里，我不当众念。',
      },
      {
        kind: 'line',
        speaker: '莫隐舟',
        text: '影子比剑快。你若分神追影，秘径会送回望劫亭前。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '我盯着你，也盯着他。劫域关的风，比天阙城更认人心。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '线头我接住，底牌我不掀。',
      },
    ],
  },
  ch8_n3: {
    blurb:
      '内府秘径暗线分叉：信接引递诀，还是信自己的判断——只改语气，不改路。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '莫隐舟',
        text: '心诀半页，用不用在你。韩承夜在侧，你一念错，他剑意先动。',
      },
      {
        kind: 'choice',
        speaker: '莫隐舟',
        prompt: '暗线走到这里，你更信哪一句？',
        options: [
          {
            label: '信接引规矩',
            reply: '诀我收着，不越谢鸣桡的线。',
          },
          {
            label: '信自己判断',
            reply: '来路不明，我先信自己的阵脚。',
          },
        ],
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '选哪种都行。别选第三种：当众揭底换席次。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '开门之后，暗线不为嘴硬。我记着。',
      },
      {
        kind: 'line',
        speaker: '莫隐舟',
        text: '劫域关影里见。传功殿集结令已在路上——别在秘径耗干。',
      },
    ],
  },
  ch8_n5: {
    blurb:
      '内府疑线暂存心底，传功殿集结令已在劫域关外响起。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '莫隐舟',
        text: '线头暂存心底。传功殿集结——柳望虚破门令，不等明日。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '暗线收束到此。席次战后算，门前先齐阵。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '心诀在袖，人不乱。我去传功殿。',
      },
      {
        kind: 'line',
        speaker: '莫隐舟',
        text: '影子会再找你。下一卷，别装没见过我。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '走。劫域关风硬，别掉队。',
      },
    ],
  },
  ch9_n3: {
    blurb:
      '传功殿门前最后一夜，柳望虚只问阵可稳否；谢鸣桡核对记名符光。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '暗线之后集结在此。最后一夜，我只问一句：阵，可稳否？',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '记名符一张张亮。{{heroName}}，符在不在袖里？',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '在。齐。劫域门在前，我不讲借口。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '韩承夜收剑意——门前私斗，先除名再除阵。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '殿前还有最后一练。稳了，再见劫域门。',
      },
    ],
  },
  ch9_n5: {
    blurb:
      '传功殿集结厅，劫域门在望，守门战在即。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '集结落定。劫域门在望——守门战，禁疗与斩杀都要算进阵里。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '不齐不出殿。你走到这里，不是运气，是行迹。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '云栈渡到劫域关，记名符一路温着。我准备好了。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '好。明日门前，别坠阵脚——卷终在此一破。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '守心。破阵是术，守心是你带来的东西。',
      },
    ],
  },
  ch10_n3: {
    blurb:
      '劫域门缝泄出劫息，像在称量你的阵；柳望虚与韩承夜同场压场。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '集结之后，门缝劫息泄出一缕——像在称量你的阵，不是称量你的嘴。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '最后一战前，我不刺你。席次卷后再说，门前别乱。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '界域关隘的盾、迷瘴林的风、试剑台的箭——我都见过。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '破门一刻在此。先清侧卫，再集火——流血与破甲，按战前提示来。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '劫域门内呼吸沉重。你若稳，我剑也稳。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '记名符在。这一破，为卷一，也为守心。',
      },
    ],
  },
  ch10_n5: {
    blurb:
      '劫域门卷一收束：修行路长，猎装与塔仍可精进；卷二将另开。',
    dialogueBeats: [
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '卷一在此收束。册上门破，路未断——猎装、塔、八题仍可精进。',
      },
      {
        kind: 'line',
        speaker: '韩承夜',
        text: '剑意敛了。席次之争，卷后再谈——你若还守心，我认你一笔。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '云栈渡灯火像还在远处。下一卷，我还带这张符。',
      },
      {
        kind: 'line',
        speaker: '柳望虚',
        text: '卷二另开 bible，行迹继承。别在门前恋战，去整备。',
      },
      {
        kind: 'line',
        speaker: '谢鸣桡',
        text: '行迹归档。守心——你一路带来的东西，比破门更难得。',
      },
      {
        kind: 'line',
        speaker: '{{heroName}}',
        text: '卷一歇下。阵还在，心还在。',
      },
    ],
  },
};

for (const [nodeId, patch] of Object.entries(PATCH)) {
  if (!overlay.nodes[nodeId]) {
    console.error('missing node', nodeId);
    process.exit(1);
  }
  if (patch.blurb) overlay.nodes[nodeId].blurb = patch.blurb;
  overlay.nodes[nodeId].dialogueBeats = patch.dialogueBeats;
}

writeFileSync(path, JSON.stringify(overlay, null, 2) + '\n', 'utf8');
console.log('patched', Object.keys(PATCH).length, 'nodes →', path);
