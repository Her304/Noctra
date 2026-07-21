import React, { useState, useEffect } from 'react';


export default function Apercu() {
    const [news, setNews] = useState([]); //start as empty array.
    function parseSummary(summary) {
        if (summary && typeof summary === 'object') return summary ;
        try{
            return JSON.parse(summary);
        } catch{
            return null;
        }
    }

    useEffect( () => {
        fetch('http://127.0.0.1:8000/news')
            .then((result) =>  
                {if (!result.ok) throw new Error(`HTTP ${result.status}`);
                return result.json();
            })
            .then((data)=>{
                console.log(data);
                setNews(data) //store all the data into js
            })
            .catch((err) => {
                console.log(err.message);
            });
    },[]);

    function AnalysisSection({title, data}) {
        if (!data || typeof data !== 'object') return null
        return (
            <div className= "analysis-section">
                <h5>{title}</h5>
                {Object.entries(data).map(([category, items]) => (
                    //destructure the data into [category, item]
                    <div key={category} className="analysis-category">
                        <h6>{category.replace(/_/g, ' ')}</h6>
                        <ul>
                            {(Array.isArray(items) ? items:[]).map((item, i) => (<li key={i}>{item}</li>))}
                        </ul>
                        </div>
                ))}
            </div>
        )
    }


    return(
        <>
            <div className="news-page-header">
                <div className="container">
                    <h1 className="google-sans-flex-page-title">Top 10 Business News — Analysis</h1>
                    <p>Today's most important stories, broken down through strategic business frameworks.</p>
                </div>
            </div>

            <div className="news-list">
                {news.map((article) => {
                    const parsed = parseSummary(article.summary);
                    return (
                    <div key={article.id} className="news-card">
                        <a href={`#title-${article.id}`} className="news-card-title">
                                {article.title}
                            </a>
                            <div className="news-text-block">
                                <span className="badge-label badge-analysis">Analysis</span>
                                {parsed && ( //if parsedSummary return null, skip rendering
                                    <>
                                        <p>{parsed.executive_summary}</p>
                                        <AnalysisSection title="SWOT" data={parsed.swot_analysis} />
                                        <AnalysisSection title="PEST" data={parsed.pest_analysis} />
                                        <AnalysisSection title="Diamond E"  data={parsed.diamond_e_analysis} />
                                    </>
                                )}
                        
                            </div>
                            <div className="news-card-meta">
                                <a href={article.url} target="_blank" rel="noopener" className="btn-source">
                                    <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.7rem' }}></i>
                                    Read Full Article
                                </a>
                                <span className="news-date">
                                    <i className="fa-regular fa-calendar" style={{ fontSize: '0.75rem' }}></i>
                                    {article.date}
                                </span>
                            </div>
                    </div>
                    );
                })}
                
                        


            </div>

        </>
    )
}