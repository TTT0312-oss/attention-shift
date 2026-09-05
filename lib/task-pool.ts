export type Lane = "counter" | "kitchen" | "stock";

export type TaskTemplate = {
  text: string;
  hint: string;
  lane: Lane;
};

const paymentMethods = [
  "現金",
  "クレジットカード",
  "デビットカード",
  "タッチ決済",
  "交通系IC",
  "電子マネー",
  "QR決済",
  "ギフトカード",
  "商品券",
  "ポイント",
  "クーポン",
  "モバイルオーダー",
];

const receiptNames = [
  "会社名",
  "個人名",
  "上様",
  "部署名",
  "店舗名",
  "学校名",
  "イベント名",
  "サークル名",
  "プロジェクト名",
  "取引先名",
  "法人名",
  "空欄",
];

const seatingRequests = [
  "窓際の席に移りたい",
  "入口から遠い席に移りたい",
  "コンセントの近くに移りたい",
  "2人席を使いたい",
  "4人席を使いたい",
  "席を分けて座りたい",
  "連れと隣に座りたい",
  "ベビーカーを置ける席がいい",
  "荷物の多い席を変えたい",
  "空いた席へ移動したい",
  "店内利用に変更したい",
  "持ち帰りに変更したい",
];

const drinks = [
  "ブレンドコーヒー",
  "アイスコーヒー",
  "カフェラテ",
  "アイスラテ",
  "カプチーノ",
  "アメリカーノ",
  "エスプレッソ",
  "カフェモカ",
  "抹茶ラテ",
  "ほうじ茶ラテ",
  "紅茶",
  "アイスティー",
  "レモネード",
  "オレンジジュース",
  "ココア",
  "チャイ",
  "ソーダ",
  "ミルク",
];

const foods = [
  "トースト",
  "サンドイッチ",
  "ホットサンド",
  "クロワッサン",
  "ベーグル",
  "スコーン",
  "マフィン",
  "ドーナツ",
  "チーズケーキ",
  "ショートケーキ",
  "プリン",
  "パフェ",
  "サラダ",
  "スープ",
  "パスタ",
  "カレー",
  "オムライス",
  "キッシュ",
];

const stockItems = [
  "紙ナプキン",
  "ストロー",
  "マドラー",
  "紙コップ",
  "プラカップ",
  "カップふた",
  "テイクアウト袋",
  "フォーク",
  "スプーン",
  "ナイフ",
  "おしぼり",
  "ティッシュ",
  "トイレットペーパー",
  "ハンドソープ",
  "消毒液",
  "ゴミ袋",
  "レジロール",
  "伝票用紙",
  "プリンター用紙",
  "コーヒー豆",
  "デカフェ豆",
  "紅茶葉",
  "抹茶パウダー",
  "ココアパウダー",
  "牛乳",
  "豆乳",
  "オーツミルク",
  "生クリーム",
  "砂糖",
  "ガムシロップ",
  "はちみつ",
  "レモン",
  "氷",
  "シナモン",
  "チョコソース",
  "キャラメルソース",
];

const counterTasks: TaskTemplate[] = [
  ...paymentMethods.flatMap((method) => [
    { text: `${method}で支払いたい`, hint: "会計方法を確認して対応", lane: "counter" as const },
    { text: `${method}がうまく使えない`, hint: "決済状況を確認", lane: "counter" as const },
  ]),
  ...receiptNames.flatMap((name) => [
    { text: `${name}で領収書がほしい`, hint: "宛名と金額を確認", lane: "counter" as const },
    { text: `${name}の領収書を直したい`, hint: "発行内容を確認", lane: "counter" as const },
  ]),
  ...seatingRequests.flatMap((request) => [
    { text: request, hint: "空席と利用状況を確認", lane: "counter" as const },
    { text: `${request}、可能ですか`, hint: "店内状況を見て案内", lane: "counter" as const },
  ]),
];

const kitchenTasks: TaskTemplate[] = [
  ...drinks.flatMap((drink) => [
    { text: `${drink}がまだ来ない`, hint: "提供状況を確認", lane: "kitchen" as const },
    { text: `${drink}の内容を変更したい`, hint: "作成前なら変更を共有", lane: "kitchen" as const },
  ]),
  ...foods.flatMap((food) => [
    { text: `${food}がまだ来ない`, hint: "調理状況を確認", lane: "kitchen" as const },
    { text: `${food}の注文内容を確認したい`, hint: "キッチンへ確認を共有", lane: "kitchen" as const },
  ]),
];

const stockTasks: TaskTemplate[] = stockItems.flatMap((item) => [
  { text: `${item}が少ない`, hint: "残量を確認して補充", lane: "stock" as const },
  { text: `${item}が空になった`, hint: "すぐに補充が必要", lane: "stock" as const },
]);

// 72 + 72 + 72 = 216種類。
export const taskPool: TaskTemplate[] = [
  ...counterTasks,
  ...kitchenTasks,
  ...stockTasks,
];
