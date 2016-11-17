import os
import csv
from pprint import pprint


class Standardizer(object):
    """
    Standard data structure of Iowa county-level presidential election
    results between 2000 and 2016.
    """
    raw_office = 'President/Vice President'
    data_dir = os.path.dirname(os.path.abspath(__file__))

    def __init__(self):
        print ""
        print "Running {}".format(self.__class__.__name__)
        self.in_path = os.path.join(self.data_dir, self.in_file)
        self.out_path = os.path.join(self.data_dir, self.out_file)
        self.reader = list(csv.DictReader(open(self.in_path, 'rbU')))
        self.raw_presidential = self.filter()
        self.clean_presidential = self.regroup()
        self.write()
        self.analyze()
        print ""

    def filter(self):
        print "- Parsing {} rows from {}".format(
            len(self.reader),
            self.in_path
        )
        return [
            d for d in self.reader
                if d['office'] == self.raw_office
                and 'total' not in d['jurisdiction'].lower().strip()
                and d['reporting_level'] == 'county'
        ]

    def regroup(self):
        county_dict = {}
        for row in self.raw_presidential:
            if row['jurisdiction'] not in county_dict:
                county_dict[row['jurisdiction']] = {
                    'dem_total': 0,
                    'gop_total': 0,
                    'other_total': 0,
                    'novote_total': 0,
                    'grand_total': 0,
                }

        other_list = []
        for row in self.raw_presidential:
            v = int(row['votes'])
            n = row['candidate'].strip()
            if n in self.total_names:
                county_dict[row['jurisdiction']]['grand_total'] += v
            elif n in self.dem_names:
                county_dict[row['jurisdiction']]['dem_total'] += v
            elif n in self.gop_names:
                county_dict[row['jurisdiction']]['gop_total'] += v
            elif n in self.novote_names:
                county_dict[row['jurisdiction']]['novote_total'] += v
            else:
                county_dict[row['jurisdiction']]['other_total'] += v
                if n not in other_list:
                    other_list.append(n)

        print "- Combining {} candidates into other total: {}".format(
            len(other_list),
            ", ".join(other_list)
        )
        return county_dict

    def write(self):
        print "- Writing {} rows to {}".format(
            len(self.clean_presidential),
            self.out_path
        )
        writer = csv.DictWriter(open(self.out_path, 'wb'), fieldnames=[
            'county',
            'dem_total',
            'gop_total',
            'other_total',
            'novote_total',
            'grand_total',
        ])
        writer.writeheader()
        sorted_data = sorted(self.clean_presidential.items(), key=lambda x:x[0])
        for name, data in sorted_data:
            data.update({'county': name})
            writer.writerow(data)

    def analyze(self):
        total_dict = dict(
            dem_total=sum([d['dem_total'] for d in self.clean_presidential.values()]),
            gop_total=sum([d['gop_total'] for d in self.clean_presidential.values()]),
            other_total=sum([d['other_total'] for d in self.clean_presidential.values()]),
            novote_total=sum([d['novote_total'] for d in self.clean_presidential.values()]),
            grand_total=sum([d['grand_total'] for d in self.clean_presidential.values()]),
        )
        pprint(total_dict)
        grand_total = total_dict.pop("grand_total")
        print "The grand total equals the sum of the other columns: {}".format(
            grand_total == sum(total_dict.values())
        )
        print "Expected grand total: {}".format(self.real_grand_total)
        print "The grand total equals the expected grand total: {}".format(
            self.real_grand_total == grand_total
        )
        print "Expected dem total: {}".format(self.real_dem_total)
        print "The dem total equals the expected dem total: {}".format(
            self.real_dem_total == total_dict['dem_total']
        )
        print "Expected gop total: {}".format(self.real_gop_total)
        print "The gop total equals the expected gop total: {}".format(
            self.real_gop_total == total_dict['gop_total']
        )


class Standardize2000(Standardizer):
    raw_office = 'President'
    in_file = "20001107__ia__general__president__county.csv"
    out_file = "2000.csv"
    total_names = ['Totals']
    dem_names = ['Gore / Lieberman']
    gop_names = ['Bush / Cheney']
    novote_names = ['Scattering']
    real_dem_total = 638517
    real_gop_total = 634373
    real_grand_total = 1315563


class Standardize2004(Standardizer):
    in_file = "20041102__ia__general__county.csv"
    out_file = "2004.csv"
    total_names = ['Totals']
    dem_names = ['John F. Kerry & John Edwards']
    gop_names = ['George W. Bush & Dick Cheney']
    novote_names = []
    real_dem_total = 741898
    real_gop_total = 751957
    real_grand_total = 1506908


class Standardize2008(Standardizer):
    in_file = "20081104__ia__general__county.csv"
    out_file = "2008.csv"
    total_names = ['TOTAL', 'Totals', 'Total']
    dem_names = ['BARACK OBAMA / JOE BIDEN']
    gop_names = ['JOHN MCCAIN / SARAH PALIN']
    novote_names = [
        'OVER VOTES',
        'UNDER VOTES',
        'SCATTERING',
        'OverVote',
        'UnderVote',
        'Scattering',
    ]
    real_dem_total = 828940
    real_gop_total = 682379
    real_grand_total = 1543662


class Standardize2012(Standardizer):
    in_file = "20121106__ia__general__county.csv"
    out_file = "2012.csv"
    total_names = ['Total']
    dem_names = ['Barack Obama', 'Barack Obama / Joe Biden']
    gop_names = ['Mitt Romney', 'Mitt Romney / Paul Ryan']
    novote_names = ['Over Votes', 'Under Votes']
    real_dem_total = 822544
    real_gop_total = 730617
    real_grand_total = 1589899


def main():
    Standardize2000()
    Standardize2004()
    Standardize2008()
    Standardize2012()


if __name__ == "__main__":
    main()
