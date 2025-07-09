import { MutableRefObject, useMemo } from 'react';
import { CellMeasurer, CellMeasurerCache, Masonry } from 'react-virtualized'
import { createCellPositioner } from 'react-virtualized/dist/es/Masonry'

import { UserSkill } from '~/libs/core';

import { TalentCard } from '../../components/talent-card';

import styles from './SearchResultsPage.module.scss'
import { Member } from '../../lib/models';

interface SearchResultLayoutProps {
    cache: MutableRefObject<CellMeasurerCache>
    width: number;
    skills: UserSkill[];
    matches: Member[];
    height: number;
    scrollTop: number;

}

const SearchResultLayout = ({ width, cache, skills, matches, scrollTop, height }: SearchResultLayoutProps) => {
    const gutter = 16
    const columnCount = 2
    const columnWidth = Math.floor((width - gutter * (columnCount - 1)) / columnCount)
    const cellPositioner = useMemo(() => {
        return createCellPositioner({
            cellMeasurerCache: cache.current,
            columnCount,
            columnWidth,
            spacer: gutter,
        });
        }, [columnCount, columnWidth, gutter]);
    return (
        <Masonry
            cellCount={matches.length}
            cellMeasurerCache={cache.current}
            cellPositioner={cellPositioner}
            cellRenderer={({ index, key, parent, style }) => (
                <CellMeasurer
                cache={cache.current}
                parent={parent}
                key={key}
                columnIndex={index % columnCount}
                rowIndex={Math.floor(index / columnCount)}
                >
                {({ registerChild }) => (
                    <div
                    ref={registerChild}
                    key={key}
                    style={{
                        ...style,
                        width: columnWidth,
                        marginRight: (index % columnCount === 0) ? gutter : 0,
                    }}
                    className={styles.cardWrapper}
                    >
                    <TalentCard
                        queriedSkills={skills}
                        member={matches[index]}
                        match={matches[index].skillScore}
                    />
                    </div>
                )}
                </CellMeasurer>
            )}
            height={height}
            width={width}
            scrollTop={scrollTop}
            autoHeight
        />
    )
}

export default SearchResultLayout
