import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  apiRef?: string;
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [loadedPosts, setLoadedPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadMore(): Promise<void> {
    const prismic = getPrismicClient();
    const postsResponse = await fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        setNextPage(data.next_page);
        return data.results;
      })
      .catch(err => {
        console.error(err);
      });

    const results = postsResponse.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setLoadedPosts([...loadedPosts, ...results]);
  }

  return (
    <>
      <Head>
        <title>SpaceTraveling</title>
      </Head>
      <main className={styles.container}>
        <div className={styles.posts}>
          {loadedPosts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <p>
                  <time>
                    <FiCalendar className={styles.icon} />{' '}
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    )}
                  </time>
                  <span>
                    <FiUser className={styles.icon} /> {post.data.author}
                  </span>
                </p>
              </a>
            </Link>
          ))}
        </div>
        {nextPage && (
          <button className={styles.btn} type="button" onClick={handleLoadMore}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    { fetch: ['posts.title', 'posts.subtitle', 'posts.author'], pageSize: 1 }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results,
      },
    },
  };
};
