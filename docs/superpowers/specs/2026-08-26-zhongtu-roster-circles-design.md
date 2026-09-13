# 中土故事圈卡池（破 100 · 羁绊预留）

> **地位：** 现行切片（2026-08-26 拍板，刀一已迁代码）。名单以代码为准；本文管圈与品级规则。  
> **取代：** [roster-100](./2026-08-02-roster-100-design.md) 的「100 挂池 / 西方神谱铺满 / role 占位技克隆」。  
> **配合：** [skill-design-spec](./2026-08-02-skill-design-spec.md)（母题→招牌→星章）；[character](./systems/character.md)；[ability-pool-catalog](./2026-08-02-ability-pool-catalog.md)。  
> **不负责：** 羁绊战斗结算（只存关系）；第二技能栏；金庸/古龙具名。

## 0. 拍板

| 项 | 结论 |
|----|------|
| 构成 | 中土骨干留（三国/西游/封神/山海/史传）；希腊/北欧/亚瑟**下架** |
| 开局 | 主角、张飞、赵云、悟空、华佗不动 |
| 组织 | **故事圈入池**；雨露均沾，禁止单本点将 |
| 人数 | 含主角 **200**；目录仍可加圈，不封顶 |
| 绝品 | **81**（含主角）；品级约束技能厚度 |
| 珍/良 | **珍 45 / 良 44 / 凡 30**；名气对得上的良升珍，压蓝抬紫 |
| 武侠 | 公版（聂隐娘、红线、荆轲、李白…） |
| 羁绊 | `circleId` + `bonds[]`；本轮展示、不结算 |
| 存档 | **SAVE_VERSION 16**；国外卡映射或折碎片 |
| 实现 | 两刀：先名册+独立招牌+迁移；再按圈补绝品深星轨 |

**人物卡稀有度（覆盖 character.md 旧句「稀有度只定框色」）：** 框色仍在；**另外**约束招牌/星章厚度。不改伤害公式。装备稀有度规则不变。

## 1. 品级 → 技能厚度

| 品 | 招牌 | 星章 | 可玩星上限（已有） |
|----|------|------|-------------------|
| 凡 `common` | 1 动词；技能名能认人 | 可走职能轨，**禁止**与同 role 占位技同款 | ★3 |
| 良 `rare` | 1 动词 + 1 附加（状态或规则） | 同上，母题不撞车 | ★4 |
| 珍 `epic` | 2 个能认出的效果 | 尽量个性 ★3 质变 | ★5 |
| 绝 `legendary` | 同一招 2～3 效果 | ★1–6 典故；★3/★6 必质变 | ★6 |

同圈禁止全员破甲。全池破甲名额：**孙膑、公输班**（兵家拆甲）。诸葛亮走八阵/减能，不靠破甲当身份。

凡/良**禁止** `ROLE_PLACEHOLDER_SKILLS` 换皮。每人至少：独特 `skillId`、独特显示名、一句母题、一个主动词。

## 2. 故事圈

进池 = 有一句说得清的故事，且最好能指出圈内（或标明跨圈）对手戏。主角不进圈。

### 2.1 蜀汉 `shu`（15）

羁绊：桃园三；五虎；孔明–庞统/姜维/黄月英；关羽–华佗（刮骨）；刘备–孟获（七擒）。

| id | 名 | 品 | role |
|----|----|----|------|
| liubei | 刘备 | 绝 | aoe_heal |
| guanyu | 关羽 | 绝 | st_burst |
| zhangfei | 张飞 | 绝 | tank |
| zhaoyun | 赵云 | 绝 | st_burst |
| zhuge | 诸葛亮 | 绝 | group_amp |
| pangtong | 庞统 | 绝 | group_amp |
| huatuo | 华佗 | 绝 | st_heal |
| machao | 马超 | 珍 | st_burst |
| huangyueying | 黄月英 | 珍 | group_amp |
| huangzhong | 黄忠 | 珍 | st_burst |
| jiangwei | 姜维 | 珍 | st_burst |
| xushu | 徐庶 | 良 | group_amp |
| weiyan | 魏延 | 良 | flex |
| zhurong | 祝融 | 良 | aoe_dps |
| menghuo | 孟获 | 凡 | tank |

### 2.2 群雄 `qunxiong`（17）

羁绊：曹操–典韦/许褚/郭嘉；吕布–貂蝉–陈宫；孙权–周瑜–大乔/小乔；周瑜–曹操（赤壁）；曹操–蔡文姬。

| id | 名 | 品 | role |
|----|----|----|------|
| caocao | 曹操 | 绝 | group_amp |
| lvbu | 吕布 | 绝 | st_burst |
| zhouyu | 周瑜 | 绝 | aoe_dps |
| simayi | 司马懿 | 绝 | group_amp |
| dianwei | 典韦 | 绝 | tank |
| guojia | 郭嘉 | 绝 | group_amp |
| xuchu | 许褚 | 珍 | tank |
| zhangliao | 张辽 | 珍 | aoe_dps |
| diaochan | 貂蝉 | 珍 | aoe_ctrl |
| luxun | 陆逊 | 珍 | aoe_dps |
| sunquan | 孙权 | 珍 | flex |
| daqiao | 大乔 | 珍 | aoe_heal |
| chengong | 陈宫 | 良 | st_ctrl |
| taishici | 太史慈 | 良 | flex |
| caiwenji | 蔡文姬 | 良 | aoe_heal |
| xiaoqiao | 小乔 | 凡 | st_ctrl |
| ganning | 甘宁 | 凡 | st_burst |

### 2.3 取经 `xiyou`（16）

羁绊：师徒四+白龙；牛魔–铁扇–红孩儿；金角–银角；白骨–唐僧。

| id | 名 | 品 | role |
|----|----|----|------|
| wukong | 孙悟空 | 绝 | aoe_dps |
| baigujing | 白骨精 | 绝 | aoe_ctrl |
| niumowang | 牛魔王 | 绝 | tank |
| tangseng | 唐僧 | 绝 | st_heal |
| tieshan | 铁扇公主 | 绝 | aoe_ctrl |
| honghaier | 红孩儿 | 珍 | aoe_dps |
| zhenyuanzi | 镇元子 | 珍 | group_amp |
| bajie | 猪八戒 | 珍 | tank |
| bailongma | 白龙马 | 良 | flex |
| jinjiao | 金角 | 良 | st_burst |
| yinjiao | 银角 | 良 | st_burst |
| nvguowang | 女儿国王 | 良 | st_ctrl |
| zhizhujing | 蜘蛛精 | 良 | aoe_ctrl |
| shaseng | 沙僧 | 凡 | tank |
| taibai | 太白金星 | 凡 | group_amp |
| huangfeng | 黄风怪 | 凡 | aoe_ctrl |

### 2.4 封神 `fengshen`（18）

羁绊：哪吒–李靖–太乙；哪吒–敖丙；姜子牙–申公豹；三霄–赵公明；妲己–纣王；**跨圈** 杨戬–沉香。

| id | 名 | 品 | role |
|----|----|----|------|
| nezha | 哪吒 | 绝 | flex |
| yangjian | 杨戬 | 绝 | st_burst |
| jiangziya | 姜子牙 | 绝 | group_amp |
| daji | 妲己 | 绝 | aoe_ctrl |
| shengongbao | 申公豹 | 绝 | st_ctrl |
| aobing | 敖丙 | 绝 | aoe_dps |
| taiyi | 太乙真人 | 绝 | aoe_heal |
| wenzhong | 闻仲 | 珍 | aoe_dps |
| zhaogongming | 赵公明 | 珍 | st_ctrl |
| zhouwang | 纣王 | 珍 | flex |
| lijing | 李靖 | 珍 | group_amp |
| yunxiao | 云霄 | 珍 | aoe_ctrl |
| huangfeihu | 黄飞虎 | 良 | tank |
| tuxingsun | 土行孙 | 良 | st_burst |
| dengchanyu | 邓婵玉 | 良 | st_burst |
| leizhenzi | 雷震子 | 凡 | aoe_dps |
| qiongxiao | 琼霄 | 凡 | aoe_ctrl |
| bixiao | 碧霄 | 凡 | aoe_ctrl |

### 2.5 上古 `shanggu`（16）

羁绊：女娲–伏羲；黄帝–蚩尤；后羿–嫦娥；夸父逐日；精卫填海；共工触山。火神 id=`zhurongshi`，与孟获妻 `zhurong` 分开。

| id | 名 | 品 | role |
|----|----|----|------|
| nuwa | 女娲 | 绝 | aoe_heal |
| huangdi | 黄帝 | 绝 | group_amp |
| chiyou | 蚩尤 | 绝 | aoe_dps |
| houyi | 后羿 | 绝 | st_burst |
| xiwangmu | 西王母 | 绝 | st_ctrl |
| change | 嫦娥 | 绝 | aoe_heal |
| fuxi | 伏羲 | 绝 | group_amp |
| dayu | 大禹 | 绝 | flex |
| shennong | 神农 | 珍 | st_heal |
| xingtian | 刑天 | 珍 | tank |
| jingwei | 精卫 | 珍 | st_burst |
| nuba | 旱魃 | 良 | aoe_ctrl |
| zhurongshi | 祝融氏 | 良 | aoe_dps |
| kuafu | 夸父 | 凡 | flex |
| gonggong | 共工 | 凡 | aoe_ctrl |
| jumang | 句芒 | 凡 | flex |

### 2.6 八仙 `baxian`（11）

羁绊：八仙；过海–敖广；吕洞宾–白牡丹。

| id | 名 | 品 | role |
|----|----|----|------|
| lvdongbin | 吕洞宾 | 绝 | st_burst |
| hanzhongli | 汉钟离 | 绝 | tank |
| tieguaili | 铁拐李 | 绝 | st_heal |
| aoguang | 敖广 | 绝 | aoe_ctrl |
| hexiangu | 何仙姑 | 珍 | aoe_heal |
| zhangguolao | 张果老 | 珍 | flex |
| hanxiangzi | 韩湘子 | 良 | aoe_dps |
| longnv | 龙女 | 良 | st_heal |
| lancahe | 蓝采和 | 凡 | aoe_ctrl |
| caoguojiu | 曹国舅 | 凡 | tank |
| baimudan | 白牡丹 | 凡 | st_ctrl |

### 2.7 吴越剑 `wuyue`（15）

羁绊：荆轲–高渐离；干将–莫邪；西施–范蠡；伍子胥；聂隐娘–红线。

| id | 名 | 品 | role |
|----|----|----|------|
| xishi | 西施 | 绝 | st_ctrl |
| nieyinniang | 聂隐娘 | 绝 | st_burst |
| jingke | 荆轲 | 绝 | st_burst |
| ganjiang | 干将 | 绝 | aoe_dps |
| moye | 莫邪 | 绝 | st_burst |
| libai | 李白 | 绝 | aoe_dps |
| wuzixu | 伍子胥 | 绝 | tank |
| hongxian | 红线 | 珍 | flex |
| fanli | 范蠡 | 珍 | group_amp |
| gaojianli | 高渐离 | 珍 | aoe_ctrl |
| zhuanzhu | 专诸 | 良 | st_burst |
| kunlunnu | 昆仑奴 | 良 | tank |
| yuenv | 越女 | 良 | st_burst |
| yaoli | 要离 | 凡 | st_ctrl |
| yuangong | 袁公 | 凡 | flex |

### 2.8 江南传奇 `jiangnan`（12）

羁绊：白蛇四人；梁祝；牛女；孟姜；董永–七仙女。对内成对，圈是「传奇」主题。

| id | 名 | 品 | role |
|----|----|----|------|
| baisuzhen | 白素贞 | 绝 | aoe_heal |
| xiaoqing | 小青 | 绝 | st_burst |
| fahai | 法海 | 绝 | st_ctrl |
| zhinu | 织女 | 绝 | aoe_heal |
| qixiannv | 七仙女 | 珍 | aoe_heal |
| liangshanbo | 梁山伯 | 珍 | flex |
| zhuyingtai | 祝英台 | 珍 | st_burst |
| niulang | 牛郎 | 良 | flex |
| mengjiangnv | 孟姜女 | 良 | aoe_ctrl |
| xuxian | 许仙 | 凡 | st_heal |
| wanxiliang | 万喜良 | 凡 | tank |
| dongyong | 董永 | 凡 | group_amp |

### 2.9 楚汉 `chuhan`（12）

羁绊：项羽–虞姬；刘邦–张良/韩信/萧何；鸿门樊哙/项伯。

| id | 名 | 品 | role |
|----|----|----|------|
| xiangyu | 项羽 | 绝 | aoe_dps |
| liubang | 刘邦 | 绝 | group_amp |
| hanxin | 韩信 | 绝 | group_amp |
| zhangliang | 张良 | 绝 | st_ctrl |
| yuji | 虞姬 | 绝 | aoe_heal |
| fanzeng | 范增 | 珍 | aoe_ctrl |
| xiaohe | 萧何 | 珍 | group_amp |
| quyuan | 屈原 | 珍 | st_heal |
| yingbu | 英布 | 良 | st_burst |
| fankuai | 樊哙 | 良 | tank |
| xiangbo | 项伯 | 凡 | flex |
| pengyue | 彭越 | 凡 | aoe_dps |

### 2.10 兵家 `bingjia`（10）

羁绊：鬼谷–孙膑/庞涓；孙膑–庞涓；苏秦–张仪；墨子–公输。

| id | 名 | 品 | role |
|----|----|----|------|
| guiguzi | 鬼谷子 | 绝 | group_amp |
| sunbin | 孙膑 | 绝 | group_amp |
| sunwu | 孙武 | 绝 | group_amp |
| gongshuban | 公输班 | 绝 | tank |
| pangjuan | 庞涓 | 绝 | st_burst |
| wuqi | 吴起 | 珍 | flex |
| mozi | 墨子 | 珍 | tank |
| suqin | 苏秦 | 良 | st_ctrl |
| zhangyi | 张仪 | 良 | aoe_ctrl |
| yueyi | 乐毅 | 良 | aoe_dps |

### 2.11 忠烈 `zhonglie`（12）

羁绊：杨门一线；岳飞–岳云；梁红玉–韩世忠。花木兰挂本圈（征战忠烈，对手戏最弱，接受）。

| id | 名 | 品 | role |
|----|----|----|------|
| yuefei | 岳飞 | 绝 | st_burst |
| muguiying | 穆桂英 | 绝 | aoe_dps |
| yangye | 杨业 | 绝 | tank |
| mulan | 花木兰 | 绝 | flex |
| shetaijun | 佘太君 | 绝 | group_amp |
| lianghongyu | 梁红玉 | 珍 | aoe_ctrl |
| yangyanzhao | 杨延昭 | 珍 | st_burst |
| hanshizhong | 韩世忠 | 珍 | tank |
| yangpaifeng | 杨排风 | 良 | st_burst |
| yueyun | 岳云 | 良 | st_burst |
| yangzongbao | 杨宗保 | 凡 | flex |
| zhangxian | 张宪 | 凡 | tank |

### 2.12 梁山 `liangshan`（12）

不上 108。羁绊：宋江–吴用；林冲–鲁智深；武松；卢俊义。

| id | 名 | 品 | role |
|----|----|----|------|
| linchong | 林冲 | 绝 | st_burst |
| wusong | 武松 | 绝 | st_burst |
| luzhishen | 鲁智深 | 绝 | tank |
| songjiang | 宋江 | 绝 | group_amp |
| wuyong | 吴用 | 珍 | group_amp |
| lujunyi | 卢俊义 | 珍 | flex |
| likui | 李逵 | 珍 | aoe_dps |
| gongsunsheng | 公孙胜 | 良 | aoe_ctrl |
| husanniang | 扈三娘 | 良 | st_burst |
| huarong | 花荣 | 良 | st_burst |
| yanqing | 燕青 | 良 | flex |
| chaijin | 柴进 | 凡 | aoe_heal |

### 2.13 瓦岗 `wagang`（12）

羁绊：秦琼–尉迟–程咬金；罗成–单雄信；李世民–徐茂公/魏征。不与封神李靖双开第二张「李靖」。

| id | 名 | 品 | role |
|----|----|----|------|
| qinqiong | 秦琼 | 绝 | tank |
| lishimin | 李世民 | 绝 | group_amp |
| yuchigong | 尉迟恭 | 绝 | tank |
| luocheng | 罗成 | 绝 | st_burst |
| shanxiongxin | 单雄信 | 珍 | st_burst |
| xumaogong | 徐茂公 | 珍 | group_amp |
| chengyaojin | 程咬金 | 珍 | aoe_dps |
| weizheng | 魏征 | 良 | st_ctrl |
| wangbodang | 王伯当 | 良 | flex |
| peiyuanqing | 裴元庆 | 良 | st_burst |
| limi | 李密 | 凡 | flex |
| wuyunzhao | 伍云召 | 凡 | aoe_dps |

### 2.14 宝莲 `baolian`（5 + 跨圈杨戬）

羁绊：三圣母–刘彦昌–沉香；沉香–杨戬（舅甥，杨戬在封神圈）。

| id | 名 | 品 | role |
|----|----|----|------|
| chenxiang | 沉香 | 绝 | st_burst |
| sanshengmu | 三圣母 | 绝 | aoe_heal |
| pili | 霹雳大仙 | 良 | aoe_dps |
| gashan | 嘎善 | 良 | tank |
| liuyanchang | 刘彦昌 | 凡 | st_heal |

### 2.15 降妖 `xiangyao`（8）

羁绊：钟馗捉鬼；许逊斩蛟；张道陵符；济公。黑白无常 **一张** `wuchang`。

| id | 名 | 品 | role |
|----|----|----|------|
| zhongkui | 钟馗 | 绝 | tank |
| xuxun | 许逊 | 绝 | aoe_dps |
| jigong | 济公 | 绝 | aoe_heal |
| zhangdaoling | 张道陵 | 绝 | st_ctrl |
| sazhenren | 萨真人 | 良 | group_amp |
| wanglingguan | 王灵官 | 良 | st_burst |
| cuipanguan | 崔判官 | 良 | st_ctrl |
| wuchang | 黑白无常 | 凡 | aoe_ctrl |

### 2.16 聊斋 `liaozhai`（8）

羁绊：聂小倩–宁采臣–燕赤霞。

| id | 名 | 品 | role |
|----|----|----|------|
| niexiaoqian | 聂小倩 | 绝 | st_ctrl |
| yanchixia | 燕赤霞 | 绝 | st_burst |
| huapi | 画皮 | 绝 | aoe_ctrl |
| lupan | 陆判 | 珍 | group_amp |
| yingning | 婴宁 | 珍 | aoe_heal |
| lianxiang | 莲香 | 良 | st_heal |
| jiaona | 娇娜 | 良 | flex |
| ningcaisen | 宁采臣 | 凡 | flex |

### 2.17 主角

| id | 名 | 品 | role |
|----|----|----|------|
| hero | 主角 | 绝 | flex |

不进圈、不抽。默认上阵不变。

**合计（自审）：** 16 圈 199 + 主角 = **200**；无重复 id。品级：绝 81 / 珍 45 / 良 44 / 凡 30（含主角）。20 张名气对得上的良升珍（黄忠/姜维/孙权/八戒/李靖/精卫/梁祝/萧何/墨子/李逵/程咬金等），压蓝抬紫；绝与凡不动。`st_heal` 仅 9 张，偏少但不扩人名来凑。`flex` 含主角共 25 张（哪吒/木兰/魏延等）——**不再仅主角**。

## 3. 下架名单

**核心深做删除：** `heracles` `athena` `medusa` `thor` `robin` `arthur` `beowulf`。

**扩展删除：** `zeus` `poseidon` `hades` `apollo` `artemis` `ares` `hermes` `hephaestus` `aphrodite` `perseus` `odysseus` `achilles` `hector` `orpheus` `circe` `prometheus` `atlas` `hera` `dionysus` `odin` `loki` `freya` `tyr` `heimdall` `baldur` `skadi` `fenrir` `lancelot` `gawain` `merlin` `morgana` `guinevere` `mordred`。

其 STAR_OVERRIDES / expand 深做一并删。中土深做（嫦娥、孙膑、周瑜、项羽、女娲、岳飞、姜子牙等）保留，按上表品级校准（华佗、典韦、嫦娥等升绝则 `maxStarForRarity` 跟着升）。

## 4. 存档迁移（v16）

`REMOVED_TEMPLATE_IDS` 并入 §3。`pruneRoster` 前先跑映射：

| 旧 id | 新 id |
|-------|--------|
| heracles | xingtian |
| athena | nuwa |
| medusa | huapi |
| thor | leizhenzi |
| robin | nieyinniang |
| arthur | lishimin |
| beowulf | chiyou |

扩展国外绝：按 **未拥有的同 role 中土绝** 填空；没有空位 → 全部折碎片。  
碎片：`1 + 旧 star`（至少 1）。等级/破境/星级/个人装备跟映射目标走；目标已拥有则只折碎片、装备进背包。阵容格替换 id。

不保留隐藏国外卡。

## 5. 抽卡

`gachaPoolIds` 仍 = 非主角且章节已解锁。

**必须加品级权重**（缺职能加成保留；已拥有权更低）：建议凡 8、良 5、珍 3、绝 1，再乘缺职能。软保底仍是「未拥有」，**不保绝**。

开局池不得塞满绝品。

## 6. 章节解锁

`expand.unlock` 改为按圈批次（或 `circleId` + 章）。

| 时机 | 解锁圈 / 点名 |
|------|----------------|
| 开局 `start` | 开局五人；`guanyu` `dianwei` `houyi`；蜀汉凡良；取经凡良（沙僧、孟获、白龙马等） |
| 清 ch1 | 吴越凡良；忠烈凡良 |
| 清 ch2 | 群雄全圈 |
| 清 ch3 | 梁山、瓦岗 |
| 清 ch4 | 封神、江南 |
| 清 ch5 | 楚汉、八仙、宝莲 |
| 清 ch6 | 上古、降妖、聊斋、兵家 |

点名绝品若所属圈尚未解锁，不得因「开局点名」提前进池（关羽/典韦/后羿除外，已在开局）。

**同圈珍绝：** 若该圈开局/某章只开凡良，珍绝在**下一档**解锁——蜀汉/取经珍绝 → 清 ch1；吴越/忠烈珍绝 → 清 ch2。群雄及之后按上表全圈（含珍绝）解锁。

## 7. 羁绊数据（不结算）

模板（或并行表）字段：

```ts
circleId: string;
bonds: { with: string; label: string }[]; // with 为 templateId
```

UI 伙伴详情可显示「同圈 / 羁绊」。GrowthTrack 的 bond 轴保持 disabled。禁止本轮在 `combat.ts` 读 `bonds` 加伤。

## 8. 实现两刀

**刀一（本 spec 落地）：** 约 200 模板；删国外；v16 迁移；每人独立招牌（凡良也要独特动词）；抽卡权重；章节按圈解锁；`circleId`/`bonds`；中土已深做卡按新品级留星轨。测例：不再 `exactly 100`；下架 id 不在池；映射把 `heracles` 进度送到 `xingtian`。

**刀二：** 新绝品按圈补满 ★1–6 典故轨（先取经/封神/上古/吴越，再梁山/瓦岗/聊斋）。未轮到的绝品刀一可先「厚招牌 + 职能轨」，但招牌必须已是 2～3 效果，不得破甲换皮。  
**第一批内容权威：** [legendary-knife2](./2026-08-26-legendary-knife2-design.md)（刘备、庞统、牛魔王、唐僧、铁扇；★3/★6 必岔路）。

## 9. 禁令

- 金庸、古龙、现当代影视独有名。  
- 水浒 108、封神 365、三国路人全挂。  
- `j_interrupt` / `j_reveal` 改义；能力池第三条养成；第二技能栏。  
- 共享衣柜；按战力刷怪。  
- 为填配额塞没有故事的人。

## 10. 落点

| 产物 | 路径 |
|------|------|
| 圈与名单 | 本文；代码 `roster/` 新表（可拆 `circles.ts`） |
| 模板/技能 | `templates.ts` `skills.ts` `deepKits.ts` `expandDeepKits.ts` |
| 解锁 | `chapter/defs.ts` |
| 迁移 | `save/player.ts` SAVE_VERSION 16 |
| 抽卡权重 | `gacha/gacha.ts` |
| 校验 | `roster.test.ts`：人数 200、无国外 id、绝品 81、每人独立 skillId |

**Agent 不自行 commit。**
