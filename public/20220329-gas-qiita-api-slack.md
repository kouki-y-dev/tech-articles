---
title: 【GAS】Qiita APIから自分の気になる分野の新しい記事を取得してSlackに通知させる
tags:
  - GAS
  - QiitaAPI
  - Slack
private: false
updated_at: '2022-03-29T15:31:50+09:00'
id: 0309828f4e097fa1b263
organization_url_name: null
slide: false
ignorePublish: false
posting_campaign_uuid: null
agreed_posting_campaign_term: false
---
# 概要

タイトルの通り、Qiita APIから自分の興味あるタグの記事を取得して、
Slackのチャンネルに通知するBotを作りました。

# 開発のモチベーション

- 日々のちょっとした隙間時間を有効活用したいと思う
    - この時間にゆるーくテック系の記事を読んでインプットしたい
- Qiitaからお目当ての記事を調べる時間を短縮したい
    - Bot作ってお目当てのタグの記事をSlackに通知させれば良いじゃない

# 使った物

- Slack
- Google App Script (GAS)
- Qiita API
    - [今回使ったの](https://qiita.com/api/v2/docs#get-apiv2tagstag_iditems)

# 必要な物

- Slackワークスペース
- Googleアカウント
- Qiitaアカウント

# ソースコード

```js
// qiitaAPI
const API_KEY = "xxxxxxxxxxxxxxxxxxxxxxx";

// 自分の興味あるタグをここに書く
const KEY_WORDS = ['AWS', 'Python', 'Docker'];

// Slack設定群
const SLACK_TOKEN = "xxxxxxxxxxxxxxxxxxxxx";
const SLACK_API = "https://slack.com/api/chat.postMessage";

// メッセージを投下したいチャンネル
const CHANNEL = "#xxxxx";

/**
 * Qiitaから記事を取得し、Slackに通知するメイン関数
 */
function my_function() {
  for (let i = 0; i < KEY_WORDS.length; i++) {
    article = get_article_data(KEY_WORDS[i]);

    send_to_slack(article, KEY_WORDS[i]);
  }
}

/**
 * QiitaAPIを用いて指定したtagから記事を取得する関数
 * 
 * @param  {string} tag 検索したいタグ
 * @return {array} 記事データ 
 */
function get_article_data(tag) {
  const PARAMS = {"Authorization": "Bearer "+ API_KEY};
  const HEADERS = {"headers": PARAMS};
  const API_URL = `https://qiita.com/api/v2/tags/${tag}/items/?per_page=5&page=1`;
  const RES = UrlFetchApp.fetch(API_URL, HEADERS);

  return JSON.parse(RES.getContentText());
}

/**
 * 記事データをメッセージに整形してSlackに通知する関数
 * 
 * @param {array} article 記事データ
 * @param {array} keywrod 検索したtag
 */
function send_to_slack(article, keyword) {
  let message = `${keyword}\n\n`;
  for(let j = 0; j < article.length; j++) {

    message += `${article[j].title}
${article[j].url}
LGTM: ${article[j].likes_count}

`;

  }
  const options = {
   "method": "post",
   "contentType": "application/x-www-form-urlencoded",
   "payload": {
     "token": SLACK_TOKEN,
     "channel": CHANNEL,
     "text": message
   }
  };

  UrlFetchApp.fetch(SLACK_API, options);
}
```
# 実装手順

## Qiita APIの設定

Qiitaのアカウント設定からAPI用のトークンを生成します。詳しいやり方は下記を参照してください。

https://qiita.com/miyuki_samitani/items/bfe89abb039a07e652e6

1. 「設定」から「アプリケーション > 個人用アクセストークン > 新しくトークンを発行する」

2. 「アクセストークンの発行」に飛ぶのでスコープを選ぶ
今回は読み込みだけなので`read_qiita`だけでOKです。

3. アクセストークンが発行されるのでメモる（GASで使います）… ⓵

## Slackの設定

1. [Slack APIのページ](https://api.slack.com/apps)にアクセスする
2. 「Create New App」から「From scratch」を選択する
3. 「App Name」に任意の名前を設定し、「Pick a workspace to develop your app in:」からBotを置きたいワークスペースを選択する
4. 左メニューの「Install App」を開き、「Bot User OAuth Token」をメモする（GASで使用）… ⓶


## GASの設定

1. [Googleドライブ](https://drive.google.com/drive/my-drive)に飛び、「新規」から`Google App Script`を作成
1. [上記のコード](https://qiita.com/yama_0308/items/0309828f4e097fa1b263#%E3%82%BD%E3%83%BC%E3%82%B9%E3%82%B3%E3%83%BC%E3%83%89)をコピペし、API用の各種トークン等を自分の環境に置き換える
    1.  `API_KEY` には⓵でメモった物
    1.  `KEY_WORDS`には自分が読みたい記事のキーワード
    1.  `SLACK_TOKEN`には⓶でメモった物
    1.  `CHANNEL`にはBotに記事投下させたいチャンネル
1. `my_function`を実行すればSlackにbotが記事を投下する

# ソースコード解説

```js
// 自分の興味あるタグをここに書く
const KEY_WORDS = ['AWS', 'Python', 'Docker'];

/**
 * QiitaAPIを用いて指定したtagから記事を取得する関数
 * 
 * @param  {string} tag 検索したいタグ
 * @return {array} 記事データ 
 */
function get_article_data(tag) {
  const PARAMS = {"Authorization": "Bearer "+ API_KEY};
  const HEADERS = {"headers": PARAMS};
  const API_URL = `https://qiita.com/api/v2/tags/${tag}/items/?per_page=5&page=1`;
  const RES = UrlFetchApp.fetch(API_URL, HEADERS);

  return JSON.parse(RES.getContentText());
}
```
- `https://qiita.com/api/v2/tags/${tag}/items/?per_page=5&page=1`
    - このAPIにより、`${tag}`で検索した結果を収集できる
    - `per_page=5&page=1`で「結果を5ページずつ分割した際の1ページ目」を取得できる。つまり最新の5件を取得する構成である
    - `KEY_WORDS`の中身をfor文でループし、`${tag}`に渡す仕組みである

```js
/**
 * 記事データをメッセージに整形してSlackに通知する関数
 * 
 * @param {array} article 記事データ
 * @param {array} keywrod 検索したtag
 */
function send_to_slack(article, keyword) {
  let message = `${keyword}\n\n`;
  for(let j = 0; j < article.length; j++) {

    message += `${article[j].title}
${article[j].url}
LGTM: ${article[j].likes_count}

`;

  }
  const options = {
   "method": "post",
   "contentType": "application/x-www-form-urlencoded",
   "payload": {
     "token": SLACK_TOKEN,
     "channel": CHANNEL,
     "text": message
   }
  };

  UrlFetchApp.fetch(SLACK_API, options);
}
```

- `get_article_data`で受け取った結果を整形し、Slackへ通知する関数である
- `KEY_WORDS`の単語単位でメッセージが送信される仕組みである

# 実行結果

```
AWS
【AWS環境構築メモ⑦】ELBを作成する
https://qiita.com/yuuichimizuta/items/d7dabc1b4b21de0e7e60
LGTM: 0

AWS CDKで作る CI/CDパイプライン
https://qiita.com/s1m0n281/items/776bd22075b087a40659
LGTM: 0

AWSにIaC環境をTerraformを使って構築してみた（基礎）
https://qiita.com/Engineer-at-Sauna/items/29f7c5569d578424c5a2
LGTM: 1

ぼくのかんがえたさいきょうのGithub Actionsで複数のCloudFormationファイルをCI/CDする方法
https://qiita.com/LittleWat/items/7630c765815d6d8c6e85
LGTM: 0

WSL2でaws-vaultが使えるようになるまで
https://qiita.com/papi_tokei/items/d2db617bd92839d57132
LGTM: 0

Python

Blenderでジグソーパズル風のパズルのアドオン
https://qiita.com/SaitoTsutomu/items/f71b9dfb4c68a71f848a
LGTM: 0

シェルコマンドをPythonから実行して結果をリアルタイムに標準出力に出す方法
https://qiita.com/waterada/items/65209ae58130ec669578
LGTM: 1

Python で非 async な IO 処理を並列したい場合
https://qiita.com/waterada/items/d48fa6f0fefc28256f1e
LGTM: 0

Pythonを使ってPDFの改行無しの翻訳をDeepLで実行する
https://qiita.com/komo135/items/e9a8498695d9d94b6aa7
LGTM: 0

Teamsのステータスを自動で変更する
https://qiita.com/tino1231/items/dff1a386124f7b904e81
LGTM: 0

Docker

Macでlima上のDockerにEmacsでdocker-trampする方法
https://qiita.com/waku_nagoya/items/a91d46c35b28d047db38
LGTM: 0

Rails チュートリアルを終えて
https://qiita.com/chasumaru/items/97d07dd128450184ee49
LGTM: 0

DockerでRuby on Railsの環境を構築する際のDockerfileのコマンド及びコード理解
https://qiita.com/zakino123/items/5e7ddf96096156ef814f
LGTM: 0

WSL2でDockerが動いてGUIも使える環境を作る(その2)
https://qiita.com/fjij/items/95e283ed2bff47a1a27c
LGTM: 0

さくっとDockerでEC2にGitLabを構築する
https://qiita.com/777nancy/items/fa52e64e959155ac9884
LGTM: 0
```
上記のようなメッセージがSlackへ送信されます。
後は`my_function`をトリガー設定して自動実行すれば自動で記事を投稿してくれるbotの完成です。

# あとがき

GASはこういうちょっとした仕組みを作るのに非常に便利なのでお勧めです。
