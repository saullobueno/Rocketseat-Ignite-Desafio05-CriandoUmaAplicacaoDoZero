import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function getReadingTime(): number {
    const regex = /[^\w]/;
    const words = post.data.content.reduce((acc, item) => {
      const headinglWords = item.heading?.split(regex).length ?? 0;
      const bodyWords = item.body.reduce((bodyAcc, bodyItem) => {
        return bodyAcc + bodyItem.text.split(regex).length;
      }, 0);
      return acc + headinglWords + bodyWords;
    }, 0);
    return Math.round(words / 200);
  }

  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <article className={styles.container}>
        <img
          className={styles.banner}
          src={post.data.banner.url}
          alt={post.data.title}
        />
        <h1>{post.data.title}</h1>
        <div className={styles.info}>
          <span>
            <FiCalendar className={styles.icon} />
            {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </span>
          <span>
            <FiUser className={styles.icon} />
            {post.data.author}
          </span>
          <span>
            <FiClock className={styles.icon} />
            {getReadingTime()} min
          </span>
        </div>
        {post.data.content.map(content => (
          <div
            className={styles.content}
            key={(Math.random() * 9999999).toString()}
          >
            <h2>{content.heading}</h2>
            <div
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </div>
        ))}
      </article>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {}
  );

  const slugsParams = postsResponse.results.map(result => {
    return {
      params: {
        slug: result.uid,
      },
    };
  });

  return {
    paths: slugsParams,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID(
    'posts',
    String(context.params.slug),
    {}
  );

  return {
    props: { post: response },
  };
};
