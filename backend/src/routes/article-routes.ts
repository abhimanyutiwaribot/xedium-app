import { Hono } from "hono";
import { getPrismaClient } from "../lib/prisma";
import { createArticle } from "../article/create-article";
import { editArticle } from "../article/edit-article";
import { getArticle } from "../article/get-article";
import { getArticleVersions } from "../article/get-article-versions";
import { getArticleVersion } from "../article/get-article-version";
import { publishArticle } from "../article/publish-article";
import { authMiddleware } from "../middleware/auth-middleware";
import { createArticleSchema, editArticleSchema } from "@abhimanyutiwaribot/medium-app-validation";
import { articleOwnership } from "../article/article-ownership";
import { getArticleDiff } from "../article/article-diff";
import { getArticleForEdit } from "../article/get-article-for-edit";
import { deleteArticle } from "../article/delete-article";
import { getDraftArticles } from "../article/get-draft-articles";
import { clapArticle } from "../article/clap-article";
import { toggleBookmark } from "../article/bookmark-article";
import { clapSchema } from "@abhimanyutiwaribot/medium-app-validation";


const article = new Hono<{
  Bindings: {
    DATABASE_URL: string,
    ACCELERATE_URL: string,
  };
  Variables: {
    userId: string
  }
}>;

article.onError((err, c) => {
  console.error('Error', err);
  return c.json({
    error: "Internal Server Error"
  }, 500)
})


article.use("*", authMiddleware)


//create article
article.post('/article', async (c) => {
  const prisma = getPrismaClient(c.env.ACCELERATE_URL);

  const body = await c.req.json();
  const userId = c.get('userId');

  const parsed = createArticleSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({
      error: parsed.error
    }, 400)
  }

  const articleCreate = await createArticle(
    prisma,
    userId,
    body.title,
    body.content_markdown,
    body.content_json
  )

  return c.json(articleCreate);
});


//edit article
article.put("/edit/:id", async (c) => {
  const prisma = getPrismaClient(c.env.ACCELERATE_URL);

  const articleId = c.req.param("id");
  const body = await c.req.json();

  const parsed = editArticleSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: parsed.error
    }, 400)
  }

  const userId = c.get('userId')
  const result = await editArticle(
    prisma,
    articleId,
    userId,
    body.title,
    body.content_markdown,
    body.content_json
  )

  return c.json(result);
})


//get article for edit
article.get("/edit/:id", async (c) => {
  const prisma = getPrismaClient(c.env.ACCELERATE_URL);
  const articleId = c.req.param("id");
  const userId = c.get("userId");

  const data = await getArticleForEdit(
    prisma,
    articleId,
    userId
  );

  return c.json(data);
});



// article.post("/_run-worker", async(c) => {
//     await runEventWorker(c.env.ACCELERATE_URL);
//     return c.json({
//       status: "worker ran"
//     })  
// })


//see article
article.get("/:id", async (c) => {
  const prisma = getPrismaClient(c.env.ACCELERATE_URL);
  const articleId = c.req.param("id");
  const userId = c.get('userId')
  const articleData = await getArticle(
    prisma, articleId, userId
  );

  return c.json(articleData);
});


//see article versions
article.get("/:id/versions", async (c) => {
  const prisma = getPrismaClient(c.env.ACCELERATE_URL);
  const articleId = c.req.param("id");
  const userId = c.get('userId')

  const versions = await getArticleVersions(
    prisma,
    articleId,
    userId
  );

  return c.json(versions);
});


// see article version's version 
article.get("/:id/versions/:version", async (c) => {
  const prisma = getPrismaClient(c.env.ACCELERATE_URL);
  const articleId = c.req.param("id");
  const version = Number(c.req.param("version"));
  const userId = c.get('userId')

  if (Number.isNaN(version)) {
    return c.json({
      error: "Invalid version"
    }, 400)
  }

  const data = await getArticleVersion(
    prisma,
    articleId,
    version,
    userId
  );

  return c.json(data);
});

// publish the article
article.post("/:id/publish", async (c) => {
  const prisma = getPrismaClient(c.env.ACCELERATE_URL);

  const articleId = c.req.param("id");
  const userId = c.get('userId');

  const body = await c.req.json().catch(() => ({}));
  const version = body.version;
  const theme = body.theme;

  const result = await publishArticle(
    prisma,
    articleId,
    userId,
    version,
    theme
  );

  return c.json({
    articleId: result.id,
    published: result.published,
    published_version: result.published_version,
    published_At: result.published_At,
  })
})

// diff i.e comparison between two article versions
article.get("/:id/diff", async (c) => {
  const prisma = getPrismaClient(c.env.ACCELERATE_URL)
  const articleId = c.req.param("id");
  const userId = c.get("userId");

  const from = Number(c.req.query("from"));
  const to = Number(c.req.query("to"));

  if (!from || !to || from >= to) {
    return c.json({
      error: "Invalid diff range"
    }, 400);
  }

  const diffData = await getArticleDiff(
    prisma,
    articleId,
    userId,
    from,
    to
  )

  return c.json(diffData)
})

article.get("/article/drafts", async (c) => {
  const prisma = getPrismaClient(c.env.ACCELERATE_URL);
  const userId = c.get("userId");

  const drafts = await getDraftArticles(
    prisma,
    userId
  )

  return c.json(drafts);
})

// Clap for an article
article.post("/:id/clap", async (c) => {
  const prisma = getPrismaClient(c.env.ACCELERATE_URL);
  const articleId = c.req.param("id");
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));

  const result = await clapArticle(prisma, userId, articleId);
  return c.json(result);
});


// Bookmark/Unbookmark an article
article.post("/:id/bookmark", async (c) => {
  const prisma = getPrismaClient(c.env.ACCELERATE_URL);
  const articleId = c.req.param("id");
  const userId = c.get("userId");

  const result = await toggleBookmark(prisma, userId, articleId);
  return c.json(result);
});

// Delete an article
article.delete("/:id", async (c) => {
  const prisma = getPrismaClient(c.env.ACCELERATE_URL);
  const articleId = c.req.param("id");
  const userId = c.get("userId");

  const result = await deleteArticle(prisma, articleId, userId);
  return c.json(result);
});

export default article;

